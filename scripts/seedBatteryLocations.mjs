import fs from "fs";
import path from "path";
import process from "process";
import crypto from "crypto";
import admin from "firebase-admin";

const cwd = process.cwd();

const SEED_FILE = process.env.SEED_FILE || path.join(cwd, "seed-data", "cars.seed.json");
const PLACEHOLDER_IMG = (make, model) =>
  `https://source.unsplash.com/featured/800x500/?${encodeURIComponent(`${make}-${model}-car`)}`;

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

function docIdForKey(key) {
  const h = crypto.createHash("sha1").update(String(key)).digest("hex");
  return `loc_${h}`;
}

function initFirebase() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  return admin.firestore();
}

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const buildSearchTokens = ({ makeKey, modelKey, bodyType, location, yearFrom, yearTo }) => {
  const body = String(bodyType || "").toLowerCase();
  const loc = String(location || "").toLowerCase();
  const yearFromStr = yearFrom ? String(yearFrom) : "";
  const comboSpace = `${makeKey} ${modelKey}`.trim();
  const comboDash = `${makeKey}-${modelKey}`.trim();

  return [makeKey, modelKey, body, loc, yearFromStr, comboSpace, comboDash].filter(Boolean);
};

function normalizeSeedRow(item = {}) {
  const make = String(item.make || "").trim();
  const model = String(item.model || "").trim();
  const yearFrom = Number(item.yearStart ?? item.yearFrom ?? item.year) || null;
  const yearTo = Number(item.yearEnd ?? item.yearTo ?? item.year) || yearFrom;
  const yearLabel =
    item.yearLabel ||
    (yearFrom && yearTo ? (yearFrom === yearTo ? `${yearFrom}` : `${yearFrom} - ${yearTo}`) : "");

  const makeKey = slugify(make);
  const modelKey = slugify(model);
  const bodyType = String(item.bodyType || "Other").trim() || "Other";
  const location = String(item.location || item.batteryLocation || "").trim();
  const description = String(item.description || item.notes || "").trim();

  const diagramUrl = item.diagramUrl || item.imageUrl || "";
  const thumbnailUrl = item.thumbnailUrl || item.imageUrl || "";

  const base = {
    key: item.key,
    make,
    model,
    makeKey,
    modelKey,
    yearFrom,
    yearTo,
    yearLabel,
    bodyType,
    location,
    description,
    status: "active",
    isActive: true,
    reportsPending: 0,
    diagramStatus: diagramUrl ? "uploaded" : "missing",
    thumbnailStatus: thumbnailUrl ? "uploaded" : "missing",
    marker: null,
    markerStatus: "not-assigned",
    searchTokens: buildSearchTokens({ makeKey, modelKey, bodyType, location, yearFrom, yearTo }),
    batteryCount: item.batteryCount ?? null,
    imageUrl: item.imageUrl || null,
  };

  if (!thumbnailUrl) {
    base.thumbnailUrl = PLACEHOLDER_IMG(make || makeKey, model || modelKey);
    base.thumbnailStatus = "missing";
  } else {
    base.thumbnailUrl = thumbnailUrl;
  }

  if (diagramUrl) {
    base.diagramUrl = diagramUrl;
  }

  return base;
}

async function main() {
  const items = loadSeed(SEED_FILE);
  console.log(`Seeding ${items.length} battery location rows...`);
  console.log(`Seed file:  ${SEED_FILE}`);

  const db = initFirebase();
  const col = db.collection("modules").doc("carDatabase").collection("cars");

  let batch = db.batch();
  let ops = 0;
  let written = 0;

  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const item of items) {
    const normalized = normalizeSeedRow(item);
    const id = docIdForKey(
      item.key || `${normalized.make}:${normalized.model}:${normalized.yearFrom}-${normalized.yearTo}`
    );
    const ref = col.doc(id);

    const existingSnap = await ref.get();
    const exists = existingSnap.exists;
    const existing = exists ? existingSnap.data() : {};

    const patch = { ...normalized };

    // Protect admin-uploaded assets
    if (existing?.diagramUrl) {
      delete patch.diagramUrl;
      patch.diagramStatus = existing.diagramStatus || "uploaded";
    }
    if (existing?.thumbnailUrl) {
      delete patch.thumbnailUrl;
      patch.thumbnailStatus = existing.thumbnailStatus || "uploaded";
    }
    if (existing?.marker || existing?.markerStatus) {
      delete patch.marker;
      delete patch.markerStatus;
    }

    if (!exists) {
      patch.createdAt = now;
      patch.seededAt = now;
    }
    patch.updatedAt = now;

    batch.set(ref, patch, { merge: true });
    ops += 1;
    written += 1;

    // Firestore batch limit is 500 ops
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
      console.log(`✓ committed ${written}/${items.length}`);
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`✓ Seed completed. Total written: ${written}`);
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exitCode = 1;
});
