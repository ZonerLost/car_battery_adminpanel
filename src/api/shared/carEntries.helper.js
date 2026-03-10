// /* eslint-disable no-unused-vars */
// /* eslint-disable no-useless-escape */
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getCountFromServer,
//   getDoc,
//   getDocs,
//   limit,
//   orderBy,
//   query,
//   serverTimestamp,
//   startAfter,
//   documentId,
//   updateDoc,
//   where,
// } from "firebase/firestore";
// import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
// import { db, storage } from "../../lib/firebase";
// import { inferTemplateId } from "../../config/vehicleTemplates";

// const carsCol = () => collection(db, "modules", "carDatabase", "cars");

// const trimText = (v) => String(v ?? "").trim();
// const keyText = (v) => trimText(v).toLowerCase();

// const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// function coerceYearRange(values = {}) {
//   const yfRaw = values.yearFrom ?? values.year;
//   const ytRaw = values.yearTo ?? values.year;

//   const yf =
//     yfRaw === "" || yfRaw === undefined || yfRaw === null ? NaN : Number(yfRaw);
//   const yt =
//     ytRaw === "" || ytRaw === undefined || ytRaw === null ? NaN : Number(ytRaw);

//   const hasYf = Number.isFinite(yf);
//   const hasYt = Number.isFinite(yt);

//   if (!hasYf && !hasYt) return { yearFrom: null, yearTo: null };
//   if (hasYf && !hasYt) return { yearFrom: yf, yearTo: yf };
//   if (!hasYf && hasYt) return { yearFrom: yt, yearTo: yt };
//   return { yearFrom: Math.min(yf, yt), yearTo: Math.max(yf, yt) };
// }

// function safeFileName(name) {
//   return String(name || "file")
//     .replace(/\s+/g, "_")
//     .replace(/[^\w.\-]+/g, "");
// }

// function isFileLike(input) {
//   if (!input || typeof input !== "object") return false;
//   if (typeof File !== "undefined" && input instanceof File) return true;
//   return "name" in input && "size" in input;
// }

// function normalizeFiles(input) {
//   if (!input) return {};
//   if (isFileLike(input)) return { diagramFile: input };

//   const files = {};
//   if (isFileLike(input.thumbnailFile)) files.thumbnailFile = input.thumbnailFile;
//   if (isFileLike(input.diagramFile)) files.diagramFile = input.diagramFile;
//   return files;
// }

// function normalizeSearchToken(raw) {
//   const s = keyText(raw);
//   if (!s) return "";

//   // if user types: "toyota corolla 2015" -> use first two words token
//   const parts = s.split(/\s+/).filter(Boolean);
//   if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
//   return parts[0] || "";
// }

// const coerceNumber = (value) => {
//   if (value === null || value === undefined) return null;
//   const trimmed = typeof value === "string" ? value.trim() : value;
//   if (trimmed === "") return null;
//   const n = Number(trimmed);
//   return Number.isFinite(n) ? n : null;
// };

// function buildSearchTokens({ make, model, bodyType, location, yearFrom, yearTo }) {
//   const mk = keyText(make);
//   const md = keyText(model);
//   const bt = keyText(bodyType);
//   const lc = keyText(location);

//   const tokens = [
//     mk,
//     md,
//     bt,
//     lc,
//     String(yearFrom || "").trim(),
//     String(yearTo || "").trim(),
//     mk && md ? `${mk} ${md}` : "",
//     mk && md ? `${mk}-${md}` : "",
//   ].filter(Boolean);

//   return Array.from(new Set(tokens));
// }

// async function uploadToStorage({ carId, file, kind }) {
//   const fileName = `${Date.now()}_${safeFileName(file.name)}`;
//   const storagePath = `carDatabase/cars/${carId}/${kind}/${fileName}`;

//   const storageRef = ref(storage, storagePath);
//   await uploadBytes(storageRef, file, {
//     contentType: file.type || "application/octet-stream",
//   });

//   const url = await getDownloadURL(storageRef);
//   return { url, storagePath };
// }

// async function maybeDeleteObject(storagePath) {
//   if (!storagePath) return;
//   try {
//     await deleteObject(ref(storage, storagePath));
//   } catch (e) {
//     console.warn("[storage] delete skipped", storagePath, e?.message || e);
//   }
// }

// function coerceYearFilter(v) {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : null;
// }

// function buildPagedConstraints(filters = {}) {
//   const constraints = [];
//   let needsYearOrdering = false;

//   const status = filters.status || "all";
//   const makeKey = keyText(filters.make);

//   if (status !== "all") {
//     constraints.push(where("status", "==", status));
//   }

//   if (makeKey) {
//     constraints.push(where("makeKey", "==", makeKey));
//   }

//   const yf = coerceNumber(filters.yearFrom);
//   const yt = coerceNumber(filters.yearTo);

//   if (yf != null && yt != null) {
//     const lo = Math.min(yf, yt);
//     const hi = Math.max(yf, yt);
//     constraints.push(where("yearFrom", ">=", lo));
//     constraints.push(where("yearFrom", "<=", hi));
//     needsYearOrdering = true;
//   } else if (yf != null) {
//     constraints.push(where("yearFrom", ">=", yf));
//     needsYearOrdering = true;
//   } else if (yt != null) {
//     constraints.push(where("yearFrom", "<=", yt));
//     needsYearOrdering = true;
//   }

//   const tokens = keyText(filters.search)
//     .split(/\s+/)
//     .filter(Boolean)
//     .slice(0, 10);

//   if (tokens.length > 0) {
//     constraints.push(where("searchTokens", "array-contains-any", tokens));
//   }

//   return { constraints, tokens, needsYearOrdering };
// }

// function buildListConstraints(filters = {}) {
//   const constraints = [];
//   let yearMode = "none";

//   if (filters.status && filters.status !== "all") {
//     constraints.push(where("status", "==", filters.status));
//   }

//   const token = normalizeSearchToken(filters.search);
//   if (token) {
//     constraints.push(where("searchTokens", "array-contains", token));
//   }

//   const yf = coerceYearFilter(filters.yearFrom);
//   const yt = coerceYearFilter(filters.yearTo);

//   if (yf != null && yt != null) {
//     if (yf === yt) {
//       constraints.push(where("yearFrom", "==", yf));
//       yearMode = "eq";
//     } else {
//       const lo = Math.min(yf, yt);
//       const hi = Math.max(yf, yt);
//       constraints.push(where("yearFrom", ">=", lo));
//       constraints.push(where("yearFrom", "<=", hi));
//       yearMode = "range";
//     }
//   } else if (yf != null) {
//     constraints.push(where("yearFrom", "==", yf));
//     yearMode = "eq";
//   } else if (yt != null) {
//     constraints.push(where("yearFrom", "==", yt));
//     yearMode = "eq";
//   }

//   return { constraints, yearMode };
// }

// /** --------------------------- PAGINATED LIST ---------------------------- **/
// export function buildCarsQuery({ pageSize = 25, cursor = null, filters = {} } = {}) {
//   const normalizedPageSize = [25, 50, 100].includes(pageSize) ? pageSize : 25;
//   const { constraints, needsYearOrdering } = buildPagedConstraints(filters);

//   // Deterministic ordering for pagination
//   const baseOrdering = needsYearOrdering
//     ? [orderBy("yearFrom", "asc"), orderBy(documentId(), "desc")]
//     : [orderBy("updatedAt", "desc"), orderBy(documentId(), "desc")];

//   let q = query(carsCol(), ...constraints, ...baseOrdering, limit(normalizedPageSize + 1));
//   if (cursor) {
//     q = query(carsCol(), ...constraints, ...baseOrdering, startAfter(cursor), limit(normalizedPageSize + 1));
//   }

//   return q;
// }

// export async function fetchCarsPage({ pageSize = 25, cursor = null, filters = {} } = {}) {
//   try {
//     const normalizedPageSize = [25, 50, 100].includes(pageSize) ? pageSize : 25;
//     const q = buildCarsQuery({ pageSize, cursor, filters });
//     const snap = await getDocs(q);
//     const allDocs = snap.docs;
//     const rows = allDocs
//       .map((d) => normalizeCarEntry(d))
//       .filter((row) => {
//         const yf = coerceNumber(filters.yearFrom);
//         const yt = coerceNumber(filters.yearTo);
//         if (yf == null && yt == null) return true;
//         if (yf != null && row.yearTo != null && row.yearTo < yf) return false;
//         if (yt != null && row.yearFrom != null && row.yearFrom > yt) return false;
//         return true;
//       });
//     const trimmedRows = rows.slice(0, normalizedPageSize);
//     const hasMore = allDocs.length > normalizedPageSize;
//     const nextCursor = hasMore ? allDocs[normalizedPageSize - 1] : null;

//     return {
//       rows: trimmedRows,
//       nextCursor,
//       hasMore,
//     };
//   } catch (e) {
//     const isIndex = e?.code === "failed-precondition" || /index/i.test(e?.message || "");
//     if (isIndex) {
//       console.error("[car-db] Missing Firestore index for fetchCarsPage", { filters, message: e?.message });
//     } else {
//       console.error("[car-db] fetchCarsPage failed", e);
//     }
//     throw e;
//   }
// }

// export async function fetchCarEntriesPage({
//   pageSize = 10,
//   cursor = null, // DocumentSnapshot
//   filters = {},
// } = {}) {
//   const res = await fetchCarsPage({ pageSize, cursor, filters });
//   return { data: res.rows, lastDoc: res.nextCursor };
// }

// export async function listCarEntriesPaged(args = {}) {
//   return fetchCarsPage(args);
// }

// /** ----------------------------- LIST ALL -------------------------------- **/
// const normalizeDate = (value) => {
//   if (!value) return null;
//   if (value?.toDate) {
//     try {
//       return value.toDate();
//     } catch {
//       /* ignore */
//     }
//   }
//   const d = new Date(value);
//   return Number.isNaN(d.getTime()) ? null : d;
// };

// export const normalizeCarEntry = (docSnapOrData) => {
//   const base = typeof docSnapOrData?.data === "function" ? docSnapOrData.data() : docSnapOrData || {};
//   const statusNorm = keyText(base.status) || "active";

//   const yf = Number(base.yearFrom ?? base.year);
//   const yt = Number(base.yearTo ?? base.year);

//   return {
//     id: docSnapOrData?.id || base.id,
//     ...base,
//     status: statusNorm,
//     statusNorm,
//     yearFrom: Number.isFinite(yf) ? yf : null,
//     yearTo: Number.isFinite(yt) ? yt : null,
//     createdAt: normalizeDate(base.createdAt),
//     updatedAt: normalizeDate(base.updatedAt),
//   };
// };

// export async function listCarEntries(options = {}) {
//   const { status = "all", limit: limitSize = 250, order = "desc" } = options;

//   const constraints = [orderBy("updatedAt", order === "asc" ? "asc" : "desc")];

//   if (status && status !== "all") {
//     constraints.push(where("status", "==", status));
//   }

//   if (limitSize) {
//     constraints.push(limit(limitSize));
//   }

//   try {
//     const snap = await getDocs(query(carsCol(), ...constraints));
//     return snap.docs.map((d) => normalizeCarEntry(d));
//   } catch (e) {
//     if (e?.code === "failed-precondition") {
//       console.error("[car-db] Missing Firestore index for listCarEntries. See docs/firestore-indexes.md or console link.", e);
//     } else {
//       console.error("[car-db] listCarEntries failed", e);
//     }
//     throw e;
//   }
// }

// /** ------------------------------ COUNT ---------------------------------- **/
// export async function countCarEntries(filters = {}) {
//   const { constraints } = buildPagedConstraints(filters);

//   // count query doesn't need orderBy
//   const q = query(carsCol(), ...constraints);
//   const agg = await getCountFromServer(q);
//   return agg.data().count || 0;
// }

// /** ------------------------------ GET ONE -------------------------------- **/
// export async function getCarEntry(carId) {
//   const snap = await getDoc(doc(carsCol(), carId));
//   if (!snap.exists()) return null;
//   return { id: snap.id, ...snap.data() };
// }

// /** ------------------------------ CREATE --------------------------------- **/
// export async function createCarEntry(values, filesOrDiagramFile) {
//   const files = normalizeFiles(filesOrDiagramFile);

//   const make = trimText(values?.make);
//   const model = trimText(values?.model);
//   const bodyType = trimText(values?.bodyType);
//   const location = trimText(values?.location);

//   const { yearFrom, yearTo } = coerceYearRange(values);
//   const templateId = trimText(values?.templateId) || inferTemplateId(bodyType);

//   const basePayload = {
//     make,
//     model,
//     makeKey: keyText(make),
//     modelKey: keyText(model),

//     yearFrom,
//     yearTo,

//     bodyType,
//     location,

//     templateId,

//     description: trimText(values?.description),

//     status: values?.status === "inactive" ? "inactive" : "active",
//     isActive: values?.status === "inactive" ? false : true,

//     thumbnailUrl: null,
//     thumbnailStoragePath: null,
//     thumbnailStatus: "missing",
//     thumbnailUploadedAt: null,

//     diagramUrl: null,
//     diagramStoragePath: null,
//     diagramStatus: "missing",
//     diagramUploadedAt: null,

//     marker: null,
//     markerStatus: "not-assigned",

//     reportsPending: Number(values?.reportsPending || 0),

//     searchTokens: buildSearchTokens({
//       make,
//       model,
//       bodyType,
//       location,
//       yearFrom,
//       yearTo,
//     }),

//     createdAt: serverTimestamp(),
//     updatedAt: serverTimestamp(),
//   };

//   const created = await addDoc(carsCol(), basePayload);
//   const carId = created.id;

//   if (files.thumbnailFile) {
//     const { url, storagePath } = await uploadToStorage({
//       carId,
//       file: files.thumbnailFile,
//       kind: "thumbnail",
//     });

//     await updateDoc(doc(carsCol(), carId), {
//       thumbnailUrl: url,
//       thumbnailStoragePath: storagePath,
//       thumbnailStatus: "uploaded",
//       thumbnailUploadedAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//     });
//   }

//   // Optional diagram override (template is default)
//   if (files.diagramFile) {
//     const { url, storagePath } = await uploadToStorage({
//       carId,
//       file: files.diagramFile,
//       kind: "diagram",
//     });

//     await updateDoc(doc(carsCol(), carId), {
//       diagramUrl: url,
//       diagramStoragePath: storagePath,
//       diagramStatus: "uploaded",
//       markerStatus: "pending",
//       diagramUploadedAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//     });
//   }

//   return carId;
// }

// /** ------------------------------ UPDATE --------------------------------- **/
// export async function updateCarEntry(carId, values, filesOrDiagramFile) {
//   const files = normalizeFiles(filesOrDiagramFile);

//   const docRef = doc(carsCol(), carId);
//   const existingSnap = await getDoc(docRef);
//   const existing = existingSnap.exists() ? existingSnap.data() : {};

//   const make = trimText(values?.make);
//   const model = trimText(values?.model);
//   const bodyType = trimText(values?.bodyType);
//   const location = trimText(values?.location);

//   const { yearFrom, yearTo } = coerceYearRange(values);
//   const templateId = trimText(values?.templateId) || inferTemplateId(bodyType);

//   const patch = {
//     make,
//     model,
//     makeKey: keyText(make),
//     modelKey: keyText(model),

//     yearFrom,
//     yearTo,

//     bodyType,
//     location,

//     templateId,

//     description: trimText(values?.description),

//     status: values?.status === "inactive" ? "inactive" : "active",
//     isActive: values?.status === "inactive" ? false : true,

//     reportsPending: Number(values?.reportsPending || 0),

//     searchTokens: buildSearchTokens({
//       make,
//       model,
//       bodyType,
//       location,
//       yearFrom,
//       yearTo,
//     }),

//     updatedAt: serverTimestamp(),
//   };

//   const patchExtras = {};

//   if (files.thumbnailFile) {
//     await maybeDeleteObject(existing?.thumbnailStoragePath);

//     const { url, storagePath } = await uploadToStorage({
//       carId,
//       file: files.thumbnailFile,
//       kind: "thumbnail",
//     });

//     patchExtras.thumbnailUrl = url;
//     patchExtras.thumbnailStoragePath = storagePath;
//     patchExtras.thumbnailStatus = "uploaded";
//     patchExtras.thumbnailUploadedAt = serverTimestamp();
//   }

//   if (files.diagramFile) {
//     await maybeDeleteObject(existing?.diagramStoragePath);

//     const { url, storagePath } = await uploadToStorage({
//       carId,
//       file: files.diagramFile,
//       kind: "diagram",
//     });

//     patchExtras.diagramUrl = url;
//     patchExtras.diagramStoragePath = storagePath;
//     patchExtras.diagramStatus = "uploaded";
//     patchExtras.diagramUploadedAt = serverTimestamp();

//     // Reset marker if diagram changes
//     patchExtras.marker = null;
//     patchExtras.markerStatus = "pending";
//   }

//   await updateDoc(docRef, { ...patch, ...patchExtras });
// }

// /** ------------------------- MARKER UPDATE ------------------------------- **/
// export async function saveMarker(carId, marker) {
//   let xPct = marker?.xPct;
//   let yPct = marker?.yPct;

//   if (xPct === undefined && marker?.x !== undefined) xPct = Number(marker.x) * 100;
//   if (yPct === undefined && marker?.y !== undefined) yPct = Number(marker.y) * 100;

//   xPct = clamp(Number(xPct), 0, 100);
//   yPct = clamp(Number(yPct), 0, 100);

//   if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) {
//     throw new Error("Invalid marker coordinates");
//   }

//   await updateDoc(doc(carsCol(), carId), {
//     marker: { xPct, yPct },
//     markerStatus: "set",
//     updatedAt: serverTimestamp(),
//   });
// }

// /** ---------------------------- TOGGLE ----------------------------------- **/
// export async function setCarActive(carId, active) {
//   await updateDoc(doc(carsCol(), carId), {
//     isActive: !!active,
//     status: active ? "active" : "inactive",
//     updatedAt: serverTimestamp(),
//   });
// }

// /** ---------------------------- DELETE ----------------------------------- **/
// export async function deleteCarEntry(carId) {
//   const docRef = doc(carsCol(), carId);
//   const snap = await getDoc(docRef);

//   if (snap.exists()) {
//     const data = snap.data();
//     await maybeDeleteObject(data.thumbnailStoragePath);
//     await maybeDeleteObject(data.diagramStoragePath);
//   }

//   await deleteDoc(docRef);
// }

/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-escape */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  documentId,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, storage } from "../../lib/firebase";
import { inferTemplateId } from "../../config/vehicleTemplates";

const carsCol = () => collection(db, "modules", "carDatabase", "cars");

const trimText = (v) => String(v ?? "").trim();
const keyText = (v) => trimText(v).toLowerCase();
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function coerceYearRange(values = {}) {
  const yfRaw = values.yearFrom ?? values.year;
  const ytRaw = values.yearTo ?? values.year;

  const yf = yfRaw === "" || yfRaw === undefined || yfRaw === null ? NaN : Number(yfRaw);
  const yt = ytRaw === "" || ytRaw === undefined || ytRaw === null ? NaN : Number(ytRaw);

  const hasYf = Number.isFinite(yf);
  const hasYt = Number.isFinite(yt);

  if (!hasYf && !hasYt) return { yearFrom: null, yearTo: null };
  if (hasYf && !hasYt) return { yearFrom: yf, yearTo: yf };
  if (!hasYf && hasYt) return { yearFrom: yt, yearTo: yt };
  return { yearFrom: Math.min(yf, yt), yearTo: Math.max(yf, yt) };
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
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

function toMarker(item) {
  if (!item) return null;

  let xPct = item.xPct;
  let yPct = item.yPct;

  if (xPct === undefined && item.x !== undefined) xPct = Number(item.x) * 100;
  if (yPct === undefined && item.y !== undefined) yPct = Number(item.y) * 100;

  xPct = clamp(Number(xPct), 0, 100);
  yPct = clamp(Number(yPct), 0, 100);

  if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return null;
  return {
    xPct: Number(xPct.toFixed(2)),
    yPct: Number(yPct.toFixed(2)),
  };
}

function normalizeMarkers(markers, markerValue) {
  if (Array.isArray(markers) && markers.length > 0) {
    return markers.map(toMarker).filter(Boolean);
  }

  const single = toMarker(markerValue);
  return single ? [single] : [];
}

function buildSearchTokens({ make, model, bodyType, location, description, yearFrom, yearTo }) {
  const mk = keyText(make);
  const md = keyText(model);
  const bt = keyText(bodyType);
  const lc = keyText(location);
  const desc = keyText(description);

  const descriptionTokens = desc.split(/[\/,\-]/g).map((item) => item.trim()).filter(Boolean);

  const tokens = [
    mk,
    md,
    bt,
    lc,
    String(yearFrom || "").trim(),
    String(yearTo || "").trim(),
    mk && md ? `${mk} ${md}` : "",
    mk && md ? `${mk}-${md}` : "",
    ...descriptionTokens,
  ].filter(Boolean);

  return Array.from(new Set(tokens));
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

function coerceYearFilter(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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

  const yf = coerceNumber(filters.yearFrom);
  const yt = coerceNumber(filters.yearTo);

  if (yf != null && yt != null) {
    const lo = Math.min(yf, yt);
    const hi = Math.max(yf, yt);
    constraints.push(where("yearFrom", ">=", lo));
    constraints.push(where("yearFrom", "<=", hi));
    needsYearOrdering = true;
  } else if (yf != null) {
    constraints.push(where("yearFrom", ">=", yf));
    needsYearOrdering = true;
  } else if (yt != null) {
    constraints.push(where("yearFrom", "<=", yt));
    needsYearOrdering = true;
  }

  const tokens = keyText(filters.search)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10);

  if (tokens.length > 0) {
    constraints.push(where("searchTokens", "array-contains-any", tokens));
  }

  return { constraints, tokens, needsYearOrdering };
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

  const yf = coerceYearFilter(filters.yearFrom);
  const yt = coerceYearFilter(filters.yearTo);

  if (yf != null && yt != null) {
    if (yf === yt) {
      constraints.push(where("yearFrom", "==", yf));
      yearMode = "eq";
    } else {
      const lo = Math.min(yf, yt);
      const hi = Math.max(yf, yt);
      constraints.push(where("yearFrom", ">=", lo));
      constraints.push(where("yearFrom", "<=", hi));
      yearMode = "range";
    }
  } else if (yf != null) {
    constraints.push(where("yearFrom", "==", yf));
    yearMode = "eq";
  } else if (yt != null) {
    constraints.push(where("yearFrom", "==", yt));
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
      .map((d) => normalizeCarEntry(d))
      .filter((row) => {
        const yf = coerceNumber(filters.yearFrom);
        const yt = coerceNumber(filters.yearTo);
        if (yf == null && yt == null) return true;
        if (yf != null && row.yearTo != null && row.yearTo < yf) return false;
        if (yt != null && row.yearFrom != null && row.yearFrom > yt) return false;
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
  const res = await fetchCarsPage({ pageSize, cursor, filters });
  return { data: res.rows, lastDoc: res.nextCursor };
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
      // ignore
    }
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const normalizeCarEntry = (docSnapOrData) => {
  const base =
    typeof docSnapOrData?.data === "function" ? docSnapOrData.data() : docSnapOrData || {};
  const statusNorm = keyText(base.status) || "active";

  const yf = Number(base.yearFrom ?? base.year);
  const yt = Number(base.yearTo ?? base.year);
  const markers = normalizeMarkers(base.markers, base.marker);

  return {
    id: docSnapOrData?.id || base.id,
    ...base,
    status: statusNorm,
    statusNorm,
    yearFrom: Number.isFinite(yf) ? yf : null,
    yearTo: Number.isFinite(yt) ? yt : null,
    createdAt: normalizeDate(base.createdAt),
    updatedAt: normalizeDate(base.updatedAt),
    diagramStatus: base.diagramStatus || (base.diagramUrl ? "uploaded" : "template"),
    marker: markers[0] || null,
    markers,
    markerStatus: base.markerStatus || (markers.length > 0 ? "set" : "not-assigned"),
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
    return snap.docs.map((d) => normalizeCarEntry(d));
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
  const agg = await getCountFromServer(q);
  return agg.data().count || 0;
}

export async function getCarEntry(carId) {
  const snap = await getDoc(doc(carsCol(), carId));
  if (!snap.exists()) return null;
  return normalizeCarEntry(snap);
}

export async function createCarEntry(values, filesOrDiagramFile) {
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
    diagramStatus: files.diagramFile ? "uploaded" : "template",
    diagramUploadedAt: null,

    marker: null,
    markers: [],
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
    });
  }

  return carId;
}

export async function updateCarEntry(carId, values, filesOrDiagramFile) {
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
    patchExtras.markers = [];
    patchExtras.markerStatus = "pending";
  } else if (!existing?.diagramUrl) {
    patchExtras.diagramStatus = "template";
  }

  if (didTemplateChange && !files.diagramFile) {
    patchExtras.marker = null;
    patchExtras.markers = [];
    patchExtras.markerStatus = "pending";
  }

  await updateDoc(docRef, { ...patch, ...patchExtras });
}

export async function saveMarker(carId, markerValue) {
  const nextMarker = toMarker(markerValue);
  if (!nextMarker) {
    throw new Error("Invalid marker coordinates");
  }

  const docRef = doc(carsCol(), carId);
  const existingSnap = await getDoc(docRef);
  const existing = existingSnap.exists() ? existingSnap.data() : {};
  const existingMarkers = normalizeMarkers(existing?.markers, existing?.marker);
  const nextMarkers =
    existingMarkers.length > 1 ? [nextMarker, ...existingMarkers.slice(1)] : [nextMarker];

  await updateDoc(docRef, {
    marker: nextMarker,
    markers: nextMarkers,
    markerStatus: "set",
    updatedAt: serverTimestamp(),
  });
}

export async function setCarActive(carId, active) {
  await updateDoc(doc(carsCol(), carId), {
    isActive: !!active,
    status: active ? "active" : "inactive",
    updatedAt: serverTimestamp(),
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