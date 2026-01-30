import { collection, getCountFromServer, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { normalizeReportRow } from "../FeedbackReports/FeedbackReports.helper";

const reportsCollection = () => collection(db, "modules", "feedbackReports", "reports");
const carsCollection = () => collection(db, "modules", "carDatabase", "cars");

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

const safeCount = async (q) => {
  try {
    const res = await getCountFromServer(q);
    return res.data().count ?? 0;
  } catch (e) {
    console.error("[stats] count failed", e);
    return 0;
  }
};

export async function getOverviewStats() {
  const pendingReports = await safeCount(query(reportsCollection(), where("status", "==", "pending")));

  const stats = { pendingReports };

  if (!isProductionEnv()) {
    console.log("[stats] overview fetched", stats);
  }

  return stats;
}

export async function fetchDashboardCounts() {
  const [totalCars, diagramsUploaded, pendingReports, markingMistakes] = await Promise.all([
    safeCount(carsCollection()),
    safeCount(query(carsCollection(), where("diagramStatus", "==", "uploaded"))),
    safeCount(query(reportsCollection(), where("status", "==", "pending"))),
    safeCount(
      query(
        reportsCollection(),
        where("status", "==", "pending"),
        where("type", "==", "Incorrect Location")
      )
    ),
  ]);

  const result = { totalCars, diagramsUploaded, pendingReports, markingMistakes };
  if (!isProductionEnv()) console.log("[stats] dashboard counts", result);
  return result;
}

export function subscribeOverviewStats(onData, onError) {
  const q = query(reportsCollection(), where("status", "==", "pending"), orderBy("createdAt", "desc"));

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
