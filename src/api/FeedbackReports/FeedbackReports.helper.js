/* eslint-disable no-unused-vars */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as limitDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../lib/firebase";

const reportsCol = () => collection(db, "modules", "feedbackReports", "reports");
const reportRef = (id) => doc(db, "modules", "feedbackReports", "reports", id);

const carRef = (id) => doc(db, "modules", "carDatabase", "cars", id);

const safeText = (v) => String(v ?? "").trim();

const toNumberOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeDate = (value) => {
  if (!value) return null;
  if (value?.toDate) {
    try {
      return value.toDate();
    } catch (e) {
      return null;
    }
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const normalizeReportRow = (docSnapOrData) => {
  const base = typeof docSnapOrData?.data === "function" ? docSnapOrData.data() : docSnapOrData || {};
  const statusNorm = safeText(base.status).toLowerCase();

  return {
    id: docSnapOrData?.id || base.id,
    ...base,
    status: statusNorm,
    statusNorm,
    createdAt: normalizeDate(base.createdAt),
    updatedAt: normalizeDate(base.updatedAt),
  };
};

function nowShortCode() {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const ts = String(Date.now()).slice(-5);
  return `RPT-${ts}${rand}`;
}

async function uploadReportAttachment({ uid, reportId, file }) {
  const safeName = `${Date.now()}_${file.name}`.replace(/\s+/g, "_");
  const storagePath = `feedbackReports/attachments/${uid}/${reportId}/${safeName}`;

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, {
    contentType: file.type || "application/octet-stream",
  });

  const url = await getDownloadURL(storageRef);
  return { url, storagePath };
}

export async function listReports(options = {}) {
  const { status, type, dateRange, limit = 100, pageCursor } = options;

  const constraints = [orderBy("createdAt", "desc")];

  if (status && status !== "all") constraints.push(where("status", "==", status));
  if (type && type !== "all") constraints.push(where("type", "==", type));
  if (dateRange?.start) constraints.push(where("createdAt", ">=", dateRange.start));

  if (pageCursor) constraints.push(startAfter(pageCursor));
  if (limit) constraints.push(limitDocs(limit));

  const snap = await getDocs(query(reportsCol(), ...constraints));
  const reports = snap.docs.map((d) => normalizeReportRow(d));
  const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1] : null;

  return { reports, nextCursor };
}

export async function submitReport(values, attachmentFile) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated (use anonymous auth if needed)");

  const fallbackNameFromEmail = (email) => {
    if (!email) return "";
    return email.split("@")[0] || "";
  };

  const base = {
    code: nowShortCode(),
    type: safeText(values.type),
    status: "pending",
    submittedByEmail: safeText(values.email || user.email || ""),
    submittedBy: safeText(values.email || user.email || ""),
    submittedByName: safeText(
      user.displayName ||
        values.submittedByName ||
        user.email?.split("@")?.[0] ||
        fallbackNameFromEmail(user.email)
    ),
    submittedByUid: user.uid,
    createdByUid: user.uid,
    carId: values.carId || null,
    make: safeText(values.make),
    model: safeText(values.model),
    yearFrom: toNumberOrNull(values.yearFrom ?? values.year),
    yearTo: toNumberOrNull(values.yearTo ?? values.year),
    message: safeText(values.message || ""),
    attachmentUrl: null,
    attachmentStoragePath: null,
    suggestedMarker: values.suggestedMarker || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const created = await addDoc(reportsCol(), base);

  if (base.carId) {
    await updateDoc(carRef(base.carId), {
      reportsPending: increment(1),
      updatedAt: serverTimestamp(),
    });
  }

  if (attachmentFile) {
    const { url, storagePath } = await uploadReportAttachment({
      uid: user.uid,
      reportId: created.id,
      file: attachmentFile,
    });

    await updateDoc(reportRef(created.id), {
      attachmentUrl: url,
      attachmentStoragePath: storagePath,
      updatedAt: serverTimestamp(),
    });
  }

  return created.id;
}

async function updateReportStatus(reportId, status, adminUid) {
  if (!reportId) throw new Error("Missing reportId");
  if (!["approved", "rejected"].includes(status)) throw new Error("Invalid status");

  await runTransaction(db, async (tx) => {
    const rRef = reportRef(reportId);
    const snap = await tx.get(rRef);
    if (!snap.exists()) throw new Error("Report not found");

    const current = snap.data();
    const prevStatus = current.status;

    if (prevStatus === status) return;

    tx.update(rRef, {
      status,
      reviewedByUid: adminUid || null,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (current.carId && prevStatus === "pending" && status !== "pending") {
      tx.update(carRef(current.carId), {
        reportsPending: increment(-1),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export const approveReport = (reportId, adminUid = auth.currentUser?.uid) =>
  updateReportStatus(reportId, "approved", adminUid);

export const rejectReport = (reportId, adminUid = auth.currentUser?.uid) =>
  updateReportStatus(reportId, "rejected", adminUid);

export async function deleteCarDiagramForReport({ carId }) {
  if (!carId) throw new Error("Missing carId");

  const snap = await getDoc(carRef(carId));
  if (!snap.exists()) throw new Error("Car not found");

  const car = snap.data();

  if (car.diagramStoragePath) {
    try {
      await deleteObject(ref(storage, car.diagramStoragePath));
    } catch (e) {
      console.warn("[deleteCarDiagramForReport] deleteObject failed", e);
    }
  }

  await updateDoc(carRef(carId), {
    diagramUrl: null,
    diagramStoragePath: null,
    diagramStatus: "missing",
    marker: null,
    markerStatus: "not-assigned",
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReport(report) {
  const id = typeof report === "string" ? report : report?.id;
  if (!id) throw new Error("Missing report id");

  const snap = await getDoc(reportRef(id));
  if (snap.exists()) {
    const data = snap.data();
    if (data.attachmentStoragePath) {
      try {
        await deleteObject(ref(storage, data.attachmentStoragePath));
      } catch (e) {
        console.warn("[deleteReport] delete attachment failed", e);
      }
    }

    if (data.carId && data.status === "pending") {
      await updateDoc(carRef(data.carId), {
        reportsPending: increment(-1),
        updatedAt: serverTimestamp(),
      });
    }
  }

  await deleteDoc(reportRef(id));
}

export async function reviewReport({ reportId, action, adminUid }) {
  if (action === "approved") return approveReport(reportId, adminUid);
  if (action === "rejected") return rejectReport(reportId, adminUid);
  throw new Error("Invalid action (use approved/rejected)");
}
