import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import admin from "firebase-admin";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const positionalArgs = args.filter((arg) => !arg.startsWith("--"));
const [serviceAccountPathArg, jsonPathArg] = positionalArgs;

if (!serviceAccountPathArg || !jsonPathArg) {
  console.log(`
Usage:
  node scripts/import_battery_locations_firestore.mjs ./serviceAccount.json ./battery_locations_a_v_import.json
  node scripts/import_battery_locations_firestore.mjs ./scripts/serviceAccount.json ./scripts/battery_locations_a_v_import.json

This script imports records into:
  modules/carDatabase/cars

Notes:
  - The parent document modules/carDatabase is created automatically if missing.
  - Car records use Firebase auto-generated document IDs.
  - Stable dedupe fields are stored in legacyDocId / importKey / sourceKey.
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
const jsonPath = resolveExistingPath(jsonPathArg);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Service account file not found: ${serviceAccountPath}`);
}

if (!fs.existsSync(jsonPath)) {
  throw new Error(`Import JSON file not found: ${jsonPath}`);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
const importRows = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

if (!Array.isArray(importRows) || importRows.length === 0) {
  throw new Error("Import JSON is empty or invalid.");
}

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

function normalizeSearchTokens(row = {}) {
  if (Array.isArray(row.searchTokens) && row.searchTokens.length > 0) {
    return Array.from(new Set(row.searchTokens.map((item) => keyText(item)).filter(Boolean)));
  }

  const makeKey = keyText(row.makeKey || row.make);
  const modelKey = keyText(row.modelKey || row.model);
  const bodyTypeKey = keyText(row.bodyType);
  const locationKey = keyText(row.location);
  const descriptionKey = keyText(row.description);

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
        String(row.yearFrom || "").trim(),
        String(row.yearTo || row.yearFrom || "").trim(),
        makeKey && modelKey ? `${makeKey} ${modelKey}` : "",
        makeKey && modelKey ? `${makeKey}-${modelKey}` : "",
        ...descriptionTokens,
      ].filter(Boolean)
    )
  );
}

function normalizeDiagramStatus({ diagramUrl, templateId }) {
  if (diagramUrl) return "uploaded";
  if (templateId) return "template";
  return "missing";
}

function normalizeMarkerStatus(markerStatus, marker) {
  if (marker) return "set";
  return keyText(markerStatus) === "pending" ? "pending" : "not-assigned";
}

async function ensureCarDatabaseModuleDoc() {
  const snap = await moduleDocRef.get();
  const existing = snap.exists ? snap.data() : null;

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

function buildImportPayload(row, existingData = null) {
  const make = trimText(row.make);
  const model = trimText(row.model);
  const bodyType = trimText(row.bodyType) || trimText(existingData?.bodyType) || "Other";
  const templateId = trimText(row.templateId) || trimText(existingData?.templateId) || "sedan_top_v1";
  const marker = normalizeMarker(row.marker || existingData?.marker);
  const legacyDocId =
    trimText(row.legacyDocId) ||
    trimText(row.importKey) ||
    trimText(row.sourceKey) ||
    buildStableKey(row);

  const status = row.status === "inactive" ? "inactive" : existingData?.status === "inactive" ? "inactive" : "active";
  const isActive = row.isActive === false ? false : status !== "inactive";
  const diagramUrl = row.diagramUrl || existingData?.diagramUrl || null;

  const payload = {
    make,
    model,
    makeKey: trimText(row.makeKey) || slugify(make),
    modelKey: trimText(row.modelKey) || slugify(model),
    yearFrom: row.yearFrom ?? existingData?.yearFrom ?? null,
    yearTo: row.yearTo ?? existingData?.yearTo ?? row.yearFrom ?? null,
    bodyType,
    location: trimText(row.location) || trimText(existingData?.location),
    description: trimText(row.description) || trimText(existingData?.description),
    status,
    isActive,
    templateId,
    thumbnailUrl: row.thumbnailUrl ?? existingData?.thumbnailUrl ?? null,
    thumbnailStoragePath: row.thumbnailStoragePath ?? existingData?.thumbnailStoragePath ?? null,
    thumbnailStatus: row.thumbnailStatus || existingData?.thumbnailStatus || "missing",
    thumbnailUploadedAt: existingData?.thumbnailUploadedAt ?? null,
    diagramUrl,
    diagramStoragePath: row.diagramStoragePath ?? existingData?.diagramStoragePath ?? null,
    diagramStatus: normalizeDiagramStatus({ diagramUrl, templateId }),
    diagramUploadedAt: existingData?.diagramUploadedAt ?? null,
    marker,
    markerStatus: normalizeMarkerStatus(row.markerStatus || existingData?.markerStatus, marker),
    reportsPending: Number(row.reportsPending ?? existingData?.reportsPending ?? 0),
    searchTokens: normalizeSearchTokens({
      ...existingData,
      ...row,
      make,
      model,
      bodyType,
      templateId,
    }),
    legacyDocId,
    importKey: trimText(row.importKey) || trimText(existingData?.importKey) || legacyDocId,
    sourceKey: trimText(row.sourceKey) || trimText(existingData?.sourceKey) || legacyDocId,
    sourceWorkbook:
      trimText(row.sourceWorkbook) ||
      trimText(existingData?.sourceWorkbook) ||
      "Battery_Location_A-V_Production (2).xlsx",
    importedByScript: true,
    importedAt: existingData?.importedAt ?? FieldValue.serverTimestamp(),
    createdAt: existingData?.createdAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (existingData) {
    payload.markers = FieldValue.delete();
  }

  return payload;
}

async function run() {
  console.log(`Import rows: ${importRows.length}`);

  await ensureCarDatabaseModuleDoc();

  const existingSnap = await collectionRef.get();
  const existingByStableKey = new Map();

  for (const docSnap of existingSnap.docs) {
    const data = docSnap.data() || {};
    if (!isLikelyAutoId(docSnap.id)) continue;

    const candidates = [data.importKey, data.sourceKey, data.legacyDocId].map((value) => trimText(value)).filter(Boolean);
    for (const candidate of candidates) {
      if (!existingByStableKey.has(candidate)) {
        existingByStableKey.set(candidate, docSnap);
      }
    }
  }

  let batch = db.batch();
  let writes = 0;
  let processed = 0;
  let createdCount = 0;
  let updatedCount = 0;

  for (const row of importRows) {
    const stableKey = buildStableKey(row);
    const existingDoc = existingByStableKey.get(stableKey) || null;
    const targetRef = existingDoc ? existingDoc.ref : collectionRef.doc();
    const payload = buildImportPayload(row, existingDoc?.data() || null);

    if (existingDoc) {
      batch.set(targetRef, payload, { merge: true });
    } else {
      batch.set(targetRef, payload);
    }

    if (!existingDoc) {
      existingByStableKey.set(stableKey, { ref: targetRef, data: () => payload });
      createdCount += 1;
    } else {
      updatedCount += 1;
    }

    writes += 1;
    processed += 1;

    if (writes === 400) {
      await batch.commit();
      console.log(`Committed ${processed}/${importRows.length}`);
      batch = db.batch();
      writes = 0;
    }
  }

  if (writes > 0) {
    await batch.commit();
    console.log(`Committed ${processed}/${importRows.length}`);
  }

  await ensureCarDatabaseModuleDoc();

  console.log(`Import complete. Created: ${createdCount}. Updated: ${updatedCount}.`);
}

run().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
