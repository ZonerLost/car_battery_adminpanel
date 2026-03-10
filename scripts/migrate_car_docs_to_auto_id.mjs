import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import admin from "firebase-admin";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const positionalArgs = args.filter((arg) => !arg.startsWith("--"));
const [serviceAccountPathArg] = positionalArgs;

if (!serviceAccountPathArg) {
  console.log(`
Usage:
  node scripts/migrate_car_docs_to_auto_id.mjs ./serviceAccount.json [--dry-run] [--delete-old]

This script migrates legacy custom-ID docs under:
  modules/carDatabase/cars

Default behavior:
  - Creates the missing modules/carDatabase parent doc if needed
  - Copies each legacy custom-ID doc to a NEW auto-ID doc
  - Does NOT delete old docs unless --delete-old is passed
  - Removes the legacy markers field and keeps only marker + markerStatus
`);
  process.exit(1);
}

function resolveExistingPath(inputPath) {
  const candidates = [path.resolve(inputPath), path.resolve(scriptDir, inputPath)];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

const serviceAccountPath = resolveExistingPath(serviceAccountPathArg);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Service account file not found: ${serviceAccountPath}`);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
const dryRun = flags.has("--dry-run");
const deleteOld = flags.has("--delete-old");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const moduleDocRef = db.collection("modules").doc("carDatabase");
const collectionRef = moduleDocRef.collection("cars");

function trimText(value = "") {
  return String(value ?? "").trim();
}

function keyText(value = "") {
  return trimText(value).toLowerCase();
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value)));
}

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function isLikelyAutoId(id = "") {
  return /^[A-Za-z0-9]{20}$/.test(id);
}

function buildStableKey(row = {}) {
  return [
    slugify(row.makeKey || row.make),
    slugify(row.modelKey || row.model),
    row.yearFrom ?? "na",
    row.yearTo ?? row.yearFrom ?? "na",
  ].join("__");
}

function normalizeMarker(value) {
  if (!value || typeof value !== "object") return null;

  let xPct = value.xPct;
  let yPct = value.yPct;

  if (xPct === undefined && value.x !== undefined) xPct = Number(value.x) * 100;
  if (yPct === undefined && value.y !== undefined) yPct = Number(value.y) * 100;

  xPct = clamp(xPct);
  yPct = clamp(yPct);

  if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return null;

  return {
    xPct: Number(xPct.toFixed(2)),
    yPct: Number(yPct.toFixed(2)),
  };
}

function normalizeSearchTokens(data = {}) {
  if (Array.isArray(data.searchTokens) && data.searchTokens.length > 0) {
    return Array.from(new Set(data.searchTokens.map((item) => keyText(item)).filter(Boolean)));
  }

  const makeKey = keyText(data.makeKey || data.make);
  const modelKey = keyText(data.modelKey || data.model);
  const bodyTypeKey = keyText(data.bodyType);
  const locationKey = keyText(data.location);
  const descriptionKey = keyText(data.description);

  const descriptionTokens = descriptionKey
    .split(/[\/,\-]/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(
    new Set(
      [
        makeKey,
        modelKey,
        bodyTypeKey,
        locationKey,
        String(data.yearFrom || "").trim(),
        String(data.yearTo || data.yearFrom || "").trim(),
        makeKey && modelKey ? `${makeKey} ${modelKey}` : "",
        makeKey && modelKey ? `${makeKey}-${modelKey}` : "",
        ...descriptionTokens,
      ].filter(Boolean)
    )
  );
}

function normalizeDiagramStatus(data = {}) {
  if (data.diagramUrl) return "uploaded";
  if (data.templateId) return "template";
  return "missing";
}

function normalizeMarkerStatus(markerStatus, marker) {
  if (marker) return "set";
  return keyText(markerStatus) === "pending" ? "pending" : "not-assigned";
}

async function ensureCarDatabaseModuleDoc() {
  const snap = await moduleDocRef.get();
  const existing = snap.exists ? snap.data() : null;

  if (dryRun) {
    console.log(
      `[dry-run] ensure parent doc modules/carDatabase (createdAt ${
        existing?.createdAt ? "kept" : "will be set"
      })`
    );
    return;
  }

  await moduleDocRef.set(
    {
      key: "carDatabase",
      title: "Car Database",
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing?.createdAt ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );
}

function buildMigratedPayload(data, oldDocId) {
  const { markers, ...rest } = data || {};
  const marker = normalizeMarker(data.marker);
  const stableKey = trimText(data.importKey) || trimText(data.sourceKey) || buildStableKey(data) || oldDocId;
  const templateId = trimText(data.templateId) || "sedan_top_v1";
  const status = keyText(data.status) === "inactive" ? "inactive" : "active";

  return {
    ...rest,
    makeKey: trimText(data.makeKey) || slugify(data.make),
    modelKey: trimText(data.modelKey) || slugify(data.model),
    status,
    isActive: data.isActive === false ? false : status !== "inactive",
    templateId,
    diagramStatus: normalizeDiagramStatus({ ...data, templateId }),
    marker,
    markerStatus: normalizeMarkerStatus(data.markerStatus, marker),
    reportsPending: Number(data.reportsPending || 0),
    searchTokens: normalizeSearchTokens(data),
    legacyDocId: oldDocId,
    importKey: stableKey,
    sourceKey: stableKey,
    migratedAt: FieldValue.serverTimestamp(),
    createdAt: data.createdAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function run() {
  console.log(
    `Starting migration${dryRun ? " [dry-run]" : ""}${deleteOld ? " [delete-old]" : ""}...`
  );

  await ensureCarDatabaseModuleDoc();

  const allDocsSnap = await collectionRef.get();
  const docs = allDocsSnap.docs;
  const existingMigratedKeys = new Set();

  for (const docSnap of docs) {
    const data = docSnap.data() || {};
    if (!isLikelyAutoId(docSnap.id)) continue;

    [data.legacyDocId, data.importKey, data.sourceKey]
      .map((value) => trimText(value))
      .filter(Boolean)
      .forEach((value) => existingMigratedKeys.add(value));
  }

  const legacyDocs = docs.filter((docSnap) => !isLikelyAutoId(docSnap.id));

  if (legacyDocs.length === 0) {
    console.log("No legacy custom-ID docs found. Nothing to migrate.");
    return;
  }

  console.log(`Legacy docs found: ${legacyDocs.length}`);

  let batch = dryRun ? null : db.batch();
  let writes = 0;
  let copiedCount = 0;
  let skippedCount = 0;
  let deletedCount = 0;

  for (const docSnap of legacyDocs) {
    const data = docSnap.data() || {};
    const stableKey = trimText(data.importKey) || trimText(data.sourceKey) || buildStableKey(data) || docSnap.id;
    const alreadyMigrated =
      existingMigratedKeys.has(docSnap.id) ||
      existingMigratedKeys.has(stableKey) ||
      existingMigratedKeys.has(trimText(data.legacyDocId));

    if (alreadyMigrated) {
      skippedCount += 1;
      console.log(`Skipping ${docSnap.id} (auto-ID copy already exists)`);
      continue;
    }

    const newDocRef = collectionRef.doc();
    const payload = buildMigratedPayload(data, docSnap.id);

    if (dryRun) {
      console.log(`[dry-run] copy ${docSnap.id} -> ${newDocRef.id}`);
      if (deleteOld) {
        console.log(`[dry-run] delete old doc ${docSnap.id}`);
      }
    } else {
      batch.set(newDocRef, payload);
      writes += 1;

      if (deleteOld) {
        batch.delete(docSnap.ref);
        writes += 1;
        deletedCount += 1;
      }

      if (writes >= 200) {
        await batch.commit();
        batch = db.batch();
        writes = 0;
      }
    }

    existingMigratedKeys.add(docSnap.id);
    existingMigratedKeys.add(stableKey);
    copiedCount += 1;
  }

  if (!dryRun && writes > 0) {
    await batch.commit();
  }

  await ensureCarDatabaseModuleDoc();

  console.log(
    `Migration complete. Copied: ${copiedCount}. Skipped: ${skippedCount}. Deleted old docs: ${
      deleteOld ? deletedCount : 0
    }.`
  );
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
