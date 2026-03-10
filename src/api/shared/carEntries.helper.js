/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-escape */
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, storage } from "../../lib/firebase";
import { inferTemplateId } from "../../config/vehicleTemplates";

const moduleDocRef = () => doc(db, "modules", "carDatabase");
const carsCol = () => collection(db, "modules", "carDatabase", "cars");

const trimText = (value) => String(value ?? "").trim();
const keyText = (value) => trimText(value).toLowerCase();
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

function coerceYearRange(values = {}) {
  const yearFromRaw = values.yearFrom ?? values.year;
  const yearToRaw = values.yearTo ?? values.year;

  const yearFrom =
    yearFromRaw === "" || yearFromRaw === undefined || yearFromRaw === null
      ? NaN
      : Number(yearFromRaw);
  const yearTo =
    yearToRaw === "" || yearToRaw === undefined || yearToRaw === null ? NaN : Number(yearToRaw);

  const hasYearFrom = Number.isFinite(yearFrom);
  const hasYearTo = Number.isFinite(yearTo);

  if (!hasYearFrom && !hasYearTo) return { yearFrom: null, yearTo: null };
  if (hasYearFrom && !hasYearTo) return { yearFrom, yearTo: yearFrom };
  if (!hasYearFrom && hasYearTo) return { yearFrom: yearTo, yearTo };

  return {
    yearFrom: Math.min(yearFrom, yearTo),
    yearTo: Math.max(yearFrom, yearTo),
  };
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
  if (isFileLike(input)) return { diagramFile: input };

  const files = {};
  if (isFileLike(input.thumbnailFile)) files.thumbnailFile = input.thumbnailFile;
  if (isFileLike(input.diagramFile)) files.diagramFile = input.diagramFile;
  return files;
}

function normalizeSearchToken(raw) {
  const source = keyText(raw);
  if (!source) return "";

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return parts[0] || "";
}

const coerceNumber = (value) => {
  if (value === null || value === undefined) return null;
  const trimmed = typeof value === "string" ? value.trim() : value;
  if (trimmed === "") return null;

  const numberValue = Number(trimmed);
  return Number.isFinite(numberValue) ? numberValue : null;
};

function toMarker(value) {
  if (!value || typeof value !== "object") return null;

  let xPct = value.xPct;
  let yPct = value.yPct;

  if (xPct === undefined && value.x !== undefined) xPct = Number(value.x) * 100;
  if (yPct === undefined && value.y !== undefined) yPct = Number(value.y) * 100;

  xPct = clamp(xPct, 0, 100);
  yPct = clamp(yPct, 0, 100);

  if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return null;

  return {
    xPct: Number(xPct.toFixed(2)),
    yPct: Number(yPct.toFixed(2)),
  };
}

function buildSearchTokens({ make, model, bodyType, location, description, yearFrom, yearTo }) {
  const makeKey = keyText(make);
  const modelKey = keyText(model);
  const bodyTypeKey = keyText(bodyType);
  const locationKey = keyText(location);
  const descriptionKey = keyText(description);

  const descriptionTokens = descriptionKey
    .split(/[\/,\-]/g)
    .map((item) => item.trim())
    .filter(Boolean);

  const tokens = [
    makeKey,
    modelKey,
    bodyTypeKey,
    locationKey,
    String(yearFrom || "").trim(),
    String(yearTo || "").trim(),
    makeKey && modelKey ? `${makeKey} ${modelKey}` : "",
    makeKey && modelKey ? `${makeKey}-${modelKey}` : "",
    ...descriptionTokens,
  ].filter(Boolean);

  return Array.from(new Set(tokens));
}

function normalizeDiagramStatus({ diagramStatus, diagramUrl, templateId }) {
  const status = keyText(diagramStatus);

  if (diagramUrl) return "uploaded";
  if (templateId) return "template";
  if (status === "pending") return "pending";
  return "missing";
}

function normalizeMarkerStatus(markerStatus, marker) {
  const status = keyText(markerStatus);

  if (marker) return "set";
  if (status === "pending") return "pending";
  return "not-assigned";
}

async function ensureCarDatabaseModuleDoc() {
  const refValue = moduleDocRef();
  const snap = await getDoc(refValue);
  const existing = snap.exists() ? snap.data() : null;

  await setDoc(
    refValue,
    {
      key: "carDatabase",
      title: "Car Database",
      updatedAt: serverTimestamp(),
      ...(existing?.createdAt ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );
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
  } catch (error) {
    console.warn("[storage] delete skipped", storagePath, error?.message || error);
  }
}

function coerceYearFilter(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function buildPagedConstraints(filters = {}) {
  const constraints = [];
  let needsYearOrdering = false;

  const status = filters.status || "all";
  const makeKey = keyText(filters.make);

  if (status !== "all") {
    constraints.push(where("status", "==", status));
  }

  if (makeKey) {
    constraints.push(where("makeKey", "==", makeKey));
  }

  const yearFrom = coerceNumber(filters.yearFrom);
  const yearTo = coerceNumber(filters.yearTo);

  if (yearFrom != null && yearTo != null) {
    const lowerBound = Math.min(yearFrom, yearTo);
    const upperBound = Math.max(yearFrom, yearTo);
    constraints.push(where("yearFrom", ">=", lowerBound));
    constraints.push(where("yearFrom", "<=", upperBound));
    needsYearOrdering = true;
  } else if (yearFrom != null) {
    constraints.push(where("yearFrom", ">=", yearFrom));
    needsYearOrdering = true;
  } else if (yearTo != null) {
    constraints.push(where("yearFrom", "<=", yearTo));
    needsYearOrdering = true;
  }

  const tokens = keyText(filters.search)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10);

  if (tokens.length > 0) {
    constraints.push(where("searchTokens", "array-contains-any", tokens));
  }

  return { constraints, needsYearOrdering };
}

function buildListConstraints(filters = {}) {
  const constraints = [];
  let yearMode = "none";

  if (filters.status && filters.status !== "all") {
    constraints.push(where("status", "==", filters.status));
  }

  const token = normalizeSearchToken(filters.search);
  if (token) {
    constraints.push(where("searchTokens", "array-contains", token));
  }

  const yearFrom = coerceYearFilter(filters.yearFrom);
  const yearTo = coerceYearFilter(filters.yearTo);

  if (yearFrom != null && yearTo != null) {
    if (yearFrom === yearTo) {
      constraints.push(where("yearFrom", "==", yearFrom));
      yearMode = "eq";
    } else {
      const lowerBound = Math.min(yearFrom, yearTo);
      const upperBound = Math.max(yearFrom, yearTo);
      constraints.push(where("yearFrom", ">=", lowerBound));
      constraints.push(where("yearFrom", "<=", upperBound));
      yearMode = "range";
    }
  } else if (yearFrom != null) {
    constraints.push(where("yearFrom", "==", yearFrom));
    yearMode = "eq";
  } else if (yearTo != null) {
    constraints.push(where("yearFrom", "==", yearTo));
    yearMode = "eq";
  }

  return { constraints, yearMode };
}

export function buildCarsQuery({ pageSize = 25, cursor = null, filters = {} } = {}) {
  const normalizedPageSize = [25, 50, 100].includes(pageSize) ? pageSize : 25;
  const { constraints, needsYearOrdering } = buildPagedConstraints(filters);

  const baseOrdering = needsYearOrdering
    ? [orderBy("yearFrom", "asc"), orderBy(documentId(), "desc")]
    : [orderBy("updatedAt", "desc"), orderBy(documentId(), "desc")];

  let q = query(carsCol(), ...constraints, ...baseOrdering, limit(normalizedPageSize + 1));

  if (cursor) {
    q = query(
      carsCol(),
      ...constraints,
      ...baseOrdering,
      startAfter(cursor),
      limit(normalizedPageSize + 1)
    );
  }

  return q;
}

export async function fetchCarsPage({ pageSize = 25, cursor = null, filters = {} } = {}) {
  try {
    const normalizedPageSize = [25, 50, 100].includes(pageSize) ? pageSize : 25;
    const q = buildCarsQuery({ pageSize, cursor, filters });
    const snap = await getDocs(q);
    const allDocs = snap.docs;

    const rows = allDocs
      .map((entry) => normalizeCarEntry(entry))
      .filter((row) => {
        const yearFrom = coerceNumber(filters.yearFrom);
        const yearTo = coerceNumber(filters.yearTo);

        if (yearFrom == null && yearTo == null) return true;
        if (yearFrom != null && row.yearTo != null && row.yearTo < yearFrom) return false;
        if (yearTo != null && row.yearFrom != null && row.yearFrom > yearTo) return false;
        return true;
      });

    const trimmedRows = rows.slice(0, normalizedPageSize);
    const hasMore = allDocs.length > normalizedPageSize;
    const nextCursor = hasMore ? allDocs[normalizedPageSize - 1] : null;

    return {
      rows: trimmedRows,
      nextCursor,
      hasMore,
    };
  } catch (error) {
    const isIndex = error?.code === "failed-precondition" || /index/i.test(error?.message || "");

    if (isIndex) {
      console.error("[car-db] Missing Firestore index for fetchCarsPage", {
        filters,
        message: error?.message,
      });
    } else {
      console.error("[car-db] fetchCarsPage failed", error);
    }

    throw error;
  }
}

export async function fetchCarEntriesPage({
  pageSize = 10,
  cursor = null,
  filters = {},
} = {}) {
  const result = await fetchCarsPage({ pageSize, cursor, filters });
  return { data: result.rows, lastDoc: result.nextCursor };
}

export async function listCarEntriesPaged(args = {}) {
  return fetchCarsPage(args);
}

const normalizeDate = (value) => {
  if (!value) return null;

  if (value?.toDate) {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }

  const dateValue = new Date(value);
  return Number.isNaN(dateValue.getTime()) ? null : dateValue;
};

export const normalizeCarEntry = (docSnapOrData) => {
  const base =
    typeof docSnapOrData?.data === "function" ? docSnapOrData.data() : docSnapOrData || {};
  const { markers, ...rest } = base;

  const statusNorm = keyText(base.status) || "active";
  const yearFrom = Number(base.yearFrom ?? base.year);
  const yearTo = Number(base.yearTo ?? base.year);
  const marker = toMarker(base.marker);

  return {
    id: docSnapOrData?.id || base.id,
    ...rest,
    status: statusNorm,
    statusNorm,
    yearFrom: Number.isFinite(yearFrom) ? yearFrom : null,
    yearTo: Number.isFinite(yearTo) ? yearTo : null,
    createdAt: normalizeDate(base.createdAt),
    updatedAt: normalizeDate(base.updatedAt),
    diagramStatus: normalizeDiagramStatus(base),
    marker,
    markerStatus: normalizeMarkerStatus(base.markerStatus, marker),
  };
};

export async function listCarEntries(options = {}) {
  const { status = "all", limit: limitSize = 250, order = "desc" } = options;
  const constraints = [orderBy("updatedAt", order === "asc" ? "asc" : "desc")];

  if (status && status !== "all") {
    constraints.push(where("status", "==", status));
  }

  if (limitSize) {
    constraints.push(limit(limitSize));
  }

  try {
    const snap = await getDocs(query(carsCol(), ...constraints));
    return snap.docs.map((entry) => normalizeCarEntry(entry));
  } catch (error) {
    if (error?.code === "failed-precondition") {
      console.error(
        "[car-db] Missing Firestore index for listCarEntries. See docs/firestore-indexes.md or console link.",
        error
      );
    } else {
      console.error("[car-db] listCarEntries failed", error);
    }

    throw error;
  }
}

export async function countCarEntries(filters = {}) {
  const { constraints } = buildPagedConstraints(filters);
  const q = query(carsCol(), ...constraints);
  const aggregate = await getCountFromServer(q);
  return aggregate.data().count || 0;
}

export async function getCarEntry(carId) {
  const snap = await getDoc(doc(carsCol(), carId));
  if (!snap.exists()) return null;
  return normalizeCarEntry(snap);
}

export async function createCarEntry(values, filesOrDiagramFile) {
  await ensureCarDatabaseModuleDoc();

  const files = normalizeFiles(filesOrDiagramFile);
  const make = trimText(values?.make);
  const model = trimText(values?.model);
  const bodyType = trimText(values?.bodyType);
  const location = trimText(values?.location);
  const description = trimText(values?.description);

  const { yearFrom, yearTo } = coerceYearRange(values);
  const templateId = trimText(values?.templateId) || inferTemplateId(bodyType);

  const basePayload = {
    make,
    model,
    makeKey: keyText(make),
    modelKey: keyText(model),
    yearFrom,
    yearTo,
    bodyType,
    location,
    description,
    templateId,
    status: values?.status === "inactive" ? "inactive" : "active",
    isActive: values?.status === "inactive" ? false : true,
    thumbnailUrl: null,
    thumbnailStoragePath: null,
    thumbnailStatus: "missing",
    thumbnailUploadedAt: null,
    diagramUrl: null,
    diagramStoragePath: null,
    diagramStatus: templateId ? "template" : "missing",
    diagramUploadedAt: null,
    marker: null,
    markerStatus: "not-assigned",
    reportsPending: Number(values?.reportsPending || 0),
    searchTokens: buildSearchTokens({
      make,
      model,
      bodyType,
      location,
      description,
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
      thumbnailUploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      markers: deleteField(),
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
      diagramUploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      markers: deleteField(),
    });
  }

  return carId;
}

export async function updateCarEntry(carId, values, filesOrDiagramFile) {
  await ensureCarDatabaseModuleDoc();

  const files = normalizeFiles(filesOrDiagramFile);
  const docRef = doc(carsCol(), carId);
  const existingSnap = await getDoc(docRef);
  const existing = existingSnap.exists() ? existingSnap.data() : {};

  const make = trimText(values?.make);
  const model = trimText(values?.model);
  const bodyType = trimText(values?.bodyType);
  const location = trimText(values?.location);
  const description = trimText(values?.description);

  const { yearFrom, yearTo } = coerceYearRange(values);
  const templateId = trimText(values?.templateId) || inferTemplateId(bodyType);

  const patch = {
    make,
    model,
    makeKey: keyText(make),
    modelKey: keyText(model),
    yearFrom,
    yearTo,
    bodyType,
    location,
    description,
    templateId,
    status: values?.status === "inactive" ? "inactive" : "active",
    isActive: values?.status === "inactive" ? false : true,
    reportsPending: Number(values?.reportsPending || 0),
    searchTokens: buildSearchTokens({
      make,
      model,
      bodyType,
      location,
      description,
      yearFrom,
      yearTo,
    }),
    updatedAt: serverTimestamp(),
    markers: deleteField(),
  };

  const patchExtras = {};
  const didTemplateChange = existing?.templateId !== templateId;

  if (files.thumbnailFile) {
    await maybeDeleteObject(existing?.thumbnailStoragePath);

    const { url, storagePath } = await uploadToStorage({
      carId,
      file: files.thumbnailFile,
      kind: "thumbnail",
    });

    patchExtras.thumbnailUrl = url;
    patchExtras.thumbnailStoragePath = storagePath;
    patchExtras.thumbnailStatus = "uploaded";
    patchExtras.thumbnailUploadedAt = serverTimestamp();
  }

  if (files.diagramFile) {
    await maybeDeleteObject(existing?.diagramStoragePath);

    const { url, storagePath } = await uploadToStorage({
      carId,
      file: files.diagramFile,
      kind: "diagram",
    });

    patchExtras.diagramUrl = url;
    patchExtras.diagramStoragePath = storagePath;
    patchExtras.diagramStatus = "uploaded";
    patchExtras.diagramUploadedAt = serverTimestamp();
    patchExtras.marker = null;
    patchExtras.markerStatus = "pending";
  } else if (!existing?.diagramUrl) {
    patchExtras.diagramStatus = templateId ? "template" : "missing";
  }

  if (didTemplateChange && !files.diagramFile) {
    patchExtras.marker = null;
    patchExtras.markerStatus = "pending";
  }

  await updateDoc(docRef, { ...patch, ...patchExtras });
}

export async function saveMarker(carId, markerValue) {
  await ensureCarDatabaseModuleDoc();

  const marker = toMarker(markerValue);
  if (!marker) {
    throw new Error("Invalid marker coordinates");
  }

  await updateDoc(doc(carsCol(), carId), {
    marker,
    markerStatus: "set",
    updatedAt: serverTimestamp(),
    markers: deleteField(),
  });
}

export async function setCarActive(carId, active) {
  await ensureCarDatabaseModuleDoc();

  await updateDoc(doc(carsCol(), carId), {
    isActive: !!active,
    status: active ? "active" : "inactive",
    updatedAt: serverTimestamp(),
    markers: deleteField(),
  });
}

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
