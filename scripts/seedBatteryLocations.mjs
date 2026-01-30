import fs from "fs";
import path from "path";
import process from "process";
import crypto from "crypto";
import admin from "firebase-admin";

const cwd = process.cwd();

const COLLECTION = process.env.FIRESTORE_COLLECTION || "cars";
const SEED_FILE =
  process.env.SEED_FILE ||
  path.join(cwd, "seed-data", "batteryLocations.seed.json");

function fileExists(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function loadSeed(filePath) {
  if (!fileExists(filePath)) {
    throw new Error(`Seed file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error("Seed file must export an array of objects.");
  }
  return data;
}

// Firestore doc IDs cannot contain "/" and have length limits.
// We use a stable hash of the record key (make:model:yearStart-yearEnd).
function docIdForKey(key) {
  const h = crypto.createHash("sha1").update(String(key)).digest("hex");
  return `loc_${h}`;
}

function initFirebase() {
  // Uses GOOGLE_APPLICATION_CREDENTIALS (recommended) or local default credentials.
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  return admin.firestore();
}

async function main() {
  const items = loadSeed(SEED_FILE);
  console.log(`Seeding ${items.length} battery location rows...`);
  console.log(`Collection: ${COLLECTION}`);
  console.log(`Seed file:  ${SEED_FILE}`);

  const db = initFirebase();
  const col = db.collection(COLLECTION);

  let batch = db.batch();
  let ops = 0;
  let written = 0;

  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const item of items) {
    const id = docIdForKey(item.key);
    const ref = col.doc(id);

    // Minimal normalization so queries are reliable
    const make = String(item.make || "").trim();
    const model = String(item.model || "").trim();

    const payload = {
      ...item,
      make,
      model,
      makeLower: make.toLowerCase(),
      modelLower: model.toLowerCase(),
      // helpful for search
      makeModel: `${make} ${model}`.trim(),
      makeModelLower: `${make} ${model}`.trim().toLowerCase(),
      yearStart: Number(item.yearStart),
      yearEnd: Number(item.yearEnd),
      updatedAt: now,
      seededAt: now,
    };

    batch.set(ref, payload, { merge: true });
    ops += 1;
    written += 1;

    // Firestore batch limit is 500 ops
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
      console.log(`✅ committed ${written}/${items.length}`);
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`✅ Seed completed. Total written: ${written}`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exitCode = 1;
});
