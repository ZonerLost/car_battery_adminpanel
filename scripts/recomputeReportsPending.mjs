import admin from "firebase-admin";

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function initFirebase() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  return admin.firestore();
}

async function loadCars(db) {
  const snap = await db.collection("modules").doc("carDatabase").collection("cars").get();
  const cars = new Map();

  snap.forEach((doc) => {
    const data = doc.data() || {};
    const makeKey = data.makeKey || slugify(data.make);
    const modelKey = data.modelKey || slugify(data.model);
    const yearFrom = Number.isFinite(data.yearFrom) ? data.yearFrom : Number.isFinite(data.year) ? data.year : null;
    const yearTo = Number.isFinite(data.yearTo) ? data.yearTo : yearFrom;

    const key = `${makeKey}::${modelKey}`;
    const list = cars.get(key) || [];
    list.push({ id: doc.id, ref: doc.ref, yearFrom, yearTo, data });
    cars.set(key, list);
  });

  return cars;
}

async function computePending(db, carsByKey) {
  const pendingSnap = await db
    .collection("modules")
    .doc("feedbackReports")
    .collection("reports")
    .where("status", "==", "pending")
    .get();

  const counts = new Map(); // carId -> count

  pendingSnap.forEach((doc) => {
    const r = doc.data() || {};
    const makeKey = r.makeKey || slugify(r.make);
    const modelKey = r.modelKey || slugify(r.model);
    const year = Number.isFinite(r.year) ? r.year : Number.isFinite(r.yearFrom) ? r.yearFrom : null;
    const key = `${makeKey}::${modelKey}`;
    const cars = carsByKey.get(key);
    if (!cars || !cars.length) return;

    cars.forEach((car) => {
      const from = Number.isFinite(car.yearFrom) ? car.yearFrom : null;
      const to = Number.isFinite(car.yearTo) ? car.yearTo : from;
      if (year == null || (from == null && to == null) || (from != null && to != null && year >= from && year <= to)) {
        counts.set(car.id, (counts.get(car.id) || 0) + 1);
      }
    });
  });

  return counts;
}

async function updateCars(db, counts) {
  let batch = db.batch();
  let ops = 0;
  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const [carId, count] of counts.entries()) {
    const ref = db.collection("modules").doc("carDatabase").collection("cars").doc(carId);
    batch.update(ref, { reportsPending: count, updatedAt: now });
    ops++;
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
      console.log(`✓ updated ${carId} -> ${count}`);
    }
  }

  if (ops > 0) {
    await batch.commit();
  }
}

async function main() {
  const db = initFirebase();
  console.log("Loading cars...");
  const carsByKey = await loadCars(db);
  console.log(`Loaded ${Array.from(carsByKey.values()).reduce((n, arr) => n + arr.length, 0)} cars`);

  console.log("Computing pending reports per car...");
  const counts = await computePending(db, carsByKey);
  console.log(`Found pending counts for ${counts.size} cars`);

  if (counts.size === 0) {
    console.log("No updates needed.");
    return;
  }

  console.log("Updating cars...");
  await updateCars(db, counts);
  console.log("✓ Done.");
}

main().catch((err) => {
  console.error("✗ recomputeReportsPending failed", err);
  process.exit(1);
});
