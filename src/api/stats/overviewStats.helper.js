import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { listReports, normalizeReportRow } from "../FeedbackReports/FeedbackReports.helper";

const reportsCollection = () => collection(db, "modules", "feedbackReports", "reports");

const isProductionEnv = () => {
  if (typeof process !== "undefined" && process?.env?.NODE_ENV) {
    return process.env.NODE_ENV === "production";
  }

  if (typeof import.meta !== "undefined" && import.meta?.env?.MODE) {
    return import.meta.env.MODE === "production";
  }

  return false;
};

const buildPendingCount = (reports = []) =>
  reports.reduce((sum, r) => {
    const statusNorm = String(r?.statusNorm ?? r?.status ?? "").trim().toLowerCase();
    return statusNorm === "pending" ? sum + 1 : sum;
  }, 0);

export async function getOverviewStats() {
  const reportResult = await listReports();
  const reports = Array.isArray(reportResult)
    ? reportResult
    : reportResult?.reports || reportResult?.data || [];

  const pendingReports = buildPendingCount(reports);

  const stats = { pendingReports };

  if (!isProductionEnv()) {
    console.log("[stats] overview fetched", stats);
  }

  return stats;
}

export function subscribeOverviewStats(onData, onError) {
  const q = query(reportsCollection(), orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const reports = snap.docs.map((d) => normalizeReportRow(d));
      const pendingReports = buildPendingCount(reports);
      const next = { pendingReports };

      if (!isProductionEnv()) {
        console.log("[stats] overview live", next);
      }

      onData?.(next);
    },
    (err) => {
      onError?.(err);
    }
  );

  return unsubscribe;
}
