/* eslint-disable no-useless-escape */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../../lib/firebase";

const carsCol = () => collection(db, "modules", "carDatabase", "cars");

const trimText = (v) => String(v ?? "").trim();
const keyText = (v) => trimText(v).toLowerCase();

function coerceYearRange(values = {}) {
  const yfRaw = values.yearFrom ?? values.year;
  const ytRaw = values.yearTo ?? values.year;

  const yf =
    yfRaw === "" || yfRaw === undefined || yfRaw === null ? NaN : Number(yfRaw);
  const yt =
    ytRaw === "" || ytRaw === undefined || ytRaw === null ? NaN : Number(ytRaw);

  const hasYf = Number.isFinite(yf);
  const hasYt = Number.isFinite(yt);

  if (!hasYf && !hasYt) return { yearFrom: null, yearTo: null };
  if (hasYf && !hasYt) return { yearFrom: yf, yearTo: yf };
  if (!hasYf && hasYt) return { yearFrom: yt, yearTo: yt };
  return { yearFrom: Math.min(yf, yt), yearTo: Math.max(yf, yt) };
}

function buildSearchTokens({ make, model, bodyType, location, yearFrom, yearTo }) {
  const tokens = [
    keyText(make),
    keyText(model),
    keyText(bodyType),
    keyText(location),
    String(yearFrom || "").trim(),
    String(yearTo || "").trim(),
    `${keyText(make)} ${keyText(model)}`,
    `${keyText(make)}-${keyText(model)}`,
  ].filter(Boolean);

  return Array.from(new Set(tokens));
}

function safeFileName(name) {
  return String(name || "file")
    .replace(/\s+/g, "_")
    .replace(/[^\w.\-]+/g, "");
}

function isFileLike(input) {
  if (!input || typeof input !== "object") return false;
  if (typeof File !== "undefined" && input instanceof File) return true;
  return "name" in input && "size" in input;
}

function normalizeFiles(input) {
  if (!input) return {};

  if (isFileLike(input)) {
    return { diagramFile: input };
  }

  const files = {};
  if (isFileLike(input.thumbnailFile)) files.thumbnailFile = input.thumbnailFile;
  if (isFileLike(input.diagramFile)) files.diagramFile = input.diagramFile;

  return files;
}

async function uploadToStorage({ carId, file, kind }) {
  const fileName = `${Date.now()}_${safeFileName(file.name)}`;
  const storagePath = `carDatabase/cars/${carId}/${kind}/${fileName}`;

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, {
    contentType: file.type || "application/octet-stream",
  });

  const url = await getDownloadURL(storageRef);
  return { url, storagePath };
}

async function maybeDeleteObject(storagePath) {
  if (!storagePath) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (e) {
    console.warn("[storage] delete skipped", storagePath, e?.message || e);
  }
}

/** ------------------------------- LIST ---------------------------------- **/
export async function listCarEntries() {
  const q = query(carsCol(), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** ------------------------------ CREATE --------------------------------- **/
export async function createCarEntry(values, filesOrDiagramFile) {
  const files = normalizeFiles(filesOrDiagramFile);

  const make = trimText(values?.make);
  const model = trimText(values?.model);
  const bodyType = trimText(values?.bodyType);
  const location = trimText(values?.location);

  const { yearFrom, yearTo } = coerceYearRange(values);

  const basePayload = {
    make,
    model,
    makeKey: keyText(make),
    modelKey: keyText(model),

    yearFrom,
    yearTo,

    bodyType,
    location,

    description: trimText(values?.description),

    status: values?.status === "inactive" ? "inactive" : "active",
    isActive: values?.status === "inactive" ? false : true,

    thumbnailUrl: null,
    thumbnailStoragePath: null,
    thumbnailStatus: "missing",

    diagramUrl: null,
    diagramStoragePath: null,
    diagramStatus: "missing",
    marker: null,
    markerStatus: "not-assigned",

    reportsPending: Number(values?.reportsPending || 0),

    searchTokens: buildSearchTokens({
      make,
      model,
      bodyType,
      location,
      yearFrom,
      yearTo,
    }),

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const created = await addDoc(carsCol(), basePayload);
  const carId = created.id;

  if (files.thumbnailFile) {
    const { url, storagePath } = await uploadToStorage({
      carId,
      file: files.thumbnailFile,
      kind: "thumbnail",
    });

    await updateDoc(doc(carsCol(), carId), {
      thumbnailUrl: url,
      thumbnailStoragePath: storagePath,
      thumbnailStatus: "uploaded",
      updatedAt: serverTimestamp(),
    });
  }

  if (files.diagramFile) {
    const { url, storagePath } = await uploadToStorage({
      carId,
      file: files.diagramFile,
      kind: "diagram",
    });

    await updateDoc(doc(carsCol(), carId), {
      diagramUrl: url,
      diagramStoragePath: storagePath,
      diagramStatus: "uploaded",
      markerStatus: "pending",
      updatedAt: serverTimestamp(),
    });
  }

  return carId;
}

/** ------------------------------ UPDATE --------------------------------- **/
export async function updateCarEntry(carId, values, filesOrDiagramFile) {
  const files = normalizeFiles(filesOrDiagramFile);

  const make = trimText(values?.make);
  const model = trimText(values?.model);
  const bodyType = trimText(values?.bodyType);
  const location = trimText(values?.location);

  const { yearFrom, yearTo } = coerceYearRange(values);

  const patch = {
    make,
    model,
    makeKey: keyText(make),
    modelKey: keyText(model),

    yearFrom,
    yearTo,

    bodyType,
    location,

    description: trimText(values?.description),

    status: values?.status === "inactive" ? "inactive" : "active",
    isActive: values?.status === "inactive" ? false : true,

    reportsPending: Number(values?.reportsPending || 0),

    searchTokens: buildSearchTokens({
      make,
      model,
      bodyType,
      location,
      yearFrom,
      yearTo,
    }),

    updatedAt: serverTimestamp(),
  };

  if (files.thumbnailFile) {
    await maybeDeleteObject(values?.thumbnailStoragePath);

    const { url, storagePath } = await uploadToStorage({
      carId,
      file: files.thumbnailFile,
      kind: "thumbnail",
    });

    patch.thumbnailUrl = url;
    patch.thumbnailStoragePath = storagePath;
    patch.thumbnailStatus = "uploaded";
  }

  if (files.diagramFile) {
    await maybeDeleteObject(values?.diagramStoragePath);

    const { url, storagePath } = await uploadToStorage({
      carId,
      file: files.diagramFile,
      kind: "diagram",
    });

    patch.diagramUrl = url;
    patch.diagramStoragePath = storagePath;
    patch.diagramStatus = "uploaded";
    patch.marker = null;
    patch.markerStatus = "pending";
  }

  await updateDoc(doc(carsCol(), carId), patch);
}

/** ------------------------- MARKER UPDATE ------------------------------- **/
export async function saveMarker(carId, marker) {
  await updateDoc(doc(carsCol(), carId), {
    marker: {
      xPct: Number(marker.xPct),
      yPct: Number(marker.yPct),
    },
    markerStatus: "set",
    updatedAt: serverTimestamp(),
  });
}

/** ---------------------------- TOGGLE ----------------------------------- **/
export async function setCarActive(carId, active) {
  await updateDoc(doc(carsCol(), carId), {
    isActive: !!active,
    status: active ? "active" : "inactive",
    updatedAt: serverTimestamp(),
  });
}

/** ---------------------------- DELETE ----------------------------------- **/
export async function deleteCarEntry(carId) {
  const docRef = doc(carsCol(), carId);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    const data = snap.data();
    await maybeDeleteObject(data.thumbnailStoragePath);
    await maybeDeleteObject(data.diagramStoragePath);
  }

  await deleteDoc(docRef);
}
