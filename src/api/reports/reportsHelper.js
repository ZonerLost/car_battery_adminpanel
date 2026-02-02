/* eslint-disable no-unused-vars */
import {
  collection,
  getDocs,
  limit as limitDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { normalizeReportRow } from "../FeedbackReports/FeedbackReports.helper";

const reportsCol = () => collection(db, "modules", "feedbackReports", "reports");
const usersCol = () => collection(db, "users");

const TYPE_GENERAL = "general feedback";

const safeText = (v) => String(v ?? "").trim();
const typeNorm = (t) => safeText(t).toLowerCase();

const chunk = (arr, size = 10) =>
  arr.reduce((chunks, item, idx) => {
    if (idx % size === 0) chunks.push([]);
    chunks[chunks.length - 1].push(item);
    return chunks;
  }, []);

const fallbackNameFromEmail = (email) => {
  if (!email) return "";
  return email.split("@")[0] || "";
};

const pickSubmitterDisplay = (r) =>
  safeText(
    r.submittedByDisplay ||
      r.submittedByName ||
      r.submittedByEmail ||
      r.submittedBy ||
      r.email ||
      r.submittedEmail
  ) || "—";

const computeCarKey = (r) => {
  // Used as fallback for "Car ID" when Firestore carId is missing
  const make = safeText(r.make);
  const model = safeText(r.model);
  const year = Number(r.year ?? r.yearFrom ?? r.yearTo);

  const carStr = safeText(r.car); // sometimes mobile sends combined string
  if (!make && !model && carStr) return carStr;

  const parts = [make, model, Number.isFinite(year) ? String(year) : ""].filter(Boolean);
  if (!parts.length) return null;

  return parts.join("-").replace(/\s+/g, "-").toLowerCase();
};

const buildReportQuery = (filters = {}) => {
  // Keep query simple (avoids composite index issues)
  const constraints = [orderBy("createdAt", "desc")];
  if (filters.limit) constraints.push(limitDocs(filters.limit));
  return query(reportsCol(), ...constraints);
};

export const attachSubmitterDisplay = async (reports = []) => {
  if (!Array.isArray(reports) || !reports.length) return [];

  const withDisplay = reports.map((r) => ({
    ...r,
    submittedByDisplay: pickSubmitterDisplay(r),
  }));

  const missing = withDisplay.filter(
    (r) => (r.submittedByDisplay === "—" || !r.submittedByDisplay) && (r.createdByUid || r.submittedByUid)
  );

  const uniqueUids = Array.from(
    new Set(missing.map((r) => r.createdByUid || r.submittedByUid).filter(Boolean))
  );

  if (!uniqueUids.length) return withDisplay;

  const userMap = new Map();

  for (const c of chunk(uniqueUids, 10)) {
    const snap = await getDocs(query(usersCol(), where("uid", "in", c)));
    snap.docs.forEach((d) => {
      const data = d.data();
      if (!data) return;
      const uid = data.uid || d.id;
      userMap.set(uid, { fullName: data.fullName, email: data.email });
    });
  }

  return withDisplay.map((r) => {
    if (r.submittedByDisplay && r.submittedByDisplay !== "—") return r;

    const uid = r.createdByUid || r.submittedByUid;
    const user = userMap.get(uid);

    const display =
      user?.fullName ||
      user?.email ||
      fallbackNameFromEmail(user?.email) ||
      pickSubmitterDisplay(r) ||
      "—";

    return { ...r, submittedByDisplay: display };
  });
};

export const subscribeFeedbackReports = (filters = {}, onData, onError) => {
  const q = buildReportQuery(filters);

  const unsub = onSnapshot(
    q,
    async (snap) => {
      try {
        const reports = snap.docs.map((d) => {
          const row = normalizeReportRow(d);
          const raw = d.data() || {};

          const attachmentUrl = row.attachmentUrl || raw.attachmentUrl || null;
          const attachmentName = row.attachmentName || raw.attachmentName || null;

          const carKey = computeCarKey(row);

          return {
            ...row,
            docId: d.id,
            attachmentUrl,
            attachmentName,
            submittedByDisplay: pickSubmitterDisplay(row),
            carKey, // ✅ fallback for Car ID display
          };
        });

        const resolved = await attachSubmitterDisplay(reports);
        onData?.(resolved);
      } catch (e) {
        onError?.(e);
      }
    },
    (err) => onError?.(err)
  );

  return unsub;
};
