import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  where,
  Timestamp,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

// exact collection path (no collectionGroup)
const carsCol = () => collection(db, "modules", "carDatabase", "cars");
const coverageDoc = (rangeKey) =>
  doc(db, "modules", "carDatabase", "coverage", rangeKey);

function getRangeCutoff(rangeKey) {
  const now = new Date();
  if (rangeKey === "thisMonth") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (rangeKey === "last3Months") return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (rangeKey === "thisYear") return new Date(now.getFullYear(), 0, 1);
  return null;
}

async function safeCount(constraints = []) {
  try {
    const agg = await getCountFromServer(query(carsCol(), ...constraints));
    return agg.data().count || 0;
  } catch (e) {
    console.error("[car-db] count failed", e);
    return 0;
  }
}

function trimOrUnknown(v, fallbackLabel) {
  const t = typeof v === "string" ? v.trim() : "";
  return t || fallbackLabel;
}

function aggregateCoverage(docs) {
  const typeCounts = new Map();
  const makeCounts = new Map();

  docs.forEach((snap) => {
    const d = snap.data() || {};
    const bodyType = trimOrUnknown(d.bodyType, "Unknown");
    const make = trimOrUnknown(d.make, "Unknown");

    typeCounts.set(bodyType, (typeCounts.get(bodyType) || 0) + 1);
    makeCounts.set(make, (makeCounts.get(make) || 0) + 1);
  });

  const byTypeData = Array.from(typeCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const makeEntries = Array.from(makeCounts.entries())
    .map(([make, total]) => ({ make, total }))
    .sort((a, b) => b.total - a.total);

  const byMakeData = makeEntries.slice(0, 12); // keep top 10-12

  return { byTypeData, byMakeData };
}

async function computeCoverageFromCars(rangeKey) {
  const cutoffDate = getRangeCutoff(rangeKey);
  const constraints = [];
  if (cutoffDate) {
    constraints.push(where("createdAt", ">=", Timestamp.fromDate(cutoffDate)));
  }

  const snap = await getDocs(query(carsCol(), ...constraints));
  const { byTypeData, byMakeData } = aggregateCoverage(snap.docs);

  // cache for future calls
  try {
    await setDoc(
      coverageDoc(rangeKey),
      { byType: byTypeData, byMake: byMakeData, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.warn("[car-db] coverage cache write skipped", e?.message || e);
  }

  return { byTypeData, byMakeData };
}

async function readCoverage(rangeKey) {
  try {
    const snap = await getDoc(coverageDoc(rangeKey));
    if (snap.exists()) {
      const d = snap.data() || {};
      const hasType = Array.isArray(d.byType) && d.byType.length > 0;
      const hasMake = Array.isArray(d.byMake) && d.byMake.length > 0;
      if (hasType || hasMake) {
        return {
          byTypeData: d.byType || [],
          byMakeData: d.byMake || [],
        };
      }
    }
  } catch (e) {
    console.warn("[car-db] read coverage failed, will compute", e?.message || e);
  }

  return computeCoverageFromCars(rangeKey);
}

export async function getCarDatabaseCounts(rangeKey = "all") {
  const cutoffDate = getRangeCutoff(rangeKey);
  const cutoffTs = cutoffDate ? Timestamp.fromDate(cutoffDate) : null;

  // Total cars (no filters)
  const totalCars = await safeCount([]);

  // New cars = createdAt >= cutoff
  const newCars = cutoffTs
    ? await safeCount([where("createdAt", ">=", cutoffTs)])
    : totalCars;

  /**
   * IMPORTANT FIX:
   * Do NOT do: where(diagramStatus=="uploaded") + where(createdAt>=cutoff)
   * Instead: track diagramUploadedAt when uploading diagram and query only that field.
   */
  const diagramsUploaded = cutoffTs
    ? await safeCount([where("diagramUploadedAt", ">=", cutoffTs)])
    : await safeCount([where("diagramStatus", "==", "uploaded")]);

  const coverage = await readCoverage(rangeKey);

  return {
    counts: { totalCars, newCars, diagramsUploaded },
    byTypeData: coverage.byTypeData,
    byMakeData: coverage.byMakeData,
  };
}
