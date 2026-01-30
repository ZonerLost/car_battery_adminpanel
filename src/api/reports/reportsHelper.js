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

const buildReportQuery = (filters = {}) => {
  const constraints = [orderBy("createdAt", "desc")];

  if (filters.status && filters.status !== "all") constraints.push(where("status", "==", filters.status));
  if (filters.type && filters.type !== "all") constraints.push(where("type", "==", filters.type));
  if (filters.dateRange?.start) constraints.push(where("createdAt", ">=", filters.dateRange.start));
  if (filters.limit) constraints.push(limitDocs(filters.limit));

  return query(reportsCol(), ...constraints);
};

export const attachSubmitterDisplay = async (reports = []) => {
  if (!Array.isArray(reports) || !reports.length) return [];

  const withDisplay = reports.map((r) => {
    const submittedByDisplay =
      r.submittedBy ||
      r.submittedByName ||
      r.submittedByEmail ||
      r.submittedEmail ||
      (r.createdByUid ? null : "—");
    return { ...r, submittedByDisplay };
  });

  const missing = withDisplay.filter(
    (r) => (!r.submittedByDisplay || r.submittedByDisplay === "—") && r.createdByUid
  );

  const uniqueUids = Array.from(new Set(missing.map((r) => r.createdByUid))).filter(Boolean);
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
    const user = userMap.get(r.createdByUid);
    const display = user?.fullName || user?.email || fallbackNameFromEmail(user?.email) || "—";
    return { ...r, submittedByDisplay: display };
  });
};

export const subscribeFeedbackReports = (filters = {}, onData, onError) => {
  const q = buildReportQuery(filters);

  const unsub = onSnapshot(
    q,
    async (snap) => {
      try {
        const reports = snap.docs.map((d) => ({
          ...normalizeReportRow(d),
          docId: d.id,
          submittedByDisplay: d.data()?.submittedBy || "—",
        }));
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
