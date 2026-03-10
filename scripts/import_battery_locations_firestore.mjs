import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import admin from "firebase-admin";

const [, , serviceAccountPathArg, jsonPathArg] = process.argv;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

if (!serviceAccountPathArg || !jsonPathArg) {
  console.log(`
Usage:
  node scripts/import_battery_locations_firestore.mjs ./serviceAccount.json ./battery_locations_a_v_import.json
  node scripts/import_battery_locations_firestore.mjs ./scripts/serviceAccount.json ./scripts/battery_locations_a_v_import.json

This script upserts records into:
  modules/carDatabase/cars
`);
  process.exit(1);
}

function resolveExistingPath(inputPath) {
  const candidates = [
    path.resolve(inputPath),
    path.resolve(scriptDir, inputPath),
  ];

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
const collectionRef = db.collection("modules").doc("carDatabase").collection("cars");

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function buildDocId(row) {
  return [
    slugify(row.makeKey || row.make),
    slugify(row.modelKey || row.model),
    row.yearFrom ?? "na",
    row.yearTo ?? "na",
  ].join("__");
}

async function run() {
  console.log(`Import rows: ${importRows.length}`);

  let batch = db.batch();
  let writes = 0;
  let processed = 0;

  for (const row of importRows) {
    const docId = buildDocId(row);
    const docRef = collectionRef.doc(docId);

    batch.set(
      docRef,
      {
        make: row.make || "",
        model: row.model || "",
        makeKey: row.makeKey || slugify(row.make || ""),
        modelKey: row.modelKey || slugify(row.model || ""),
        yearFrom: row.yearFrom ?? null,
        yearTo: row.yearTo ?? null,
        bodyType: row.bodyType || "Other",
        location: row.location || "",
        description: row.description || "",
        status: row.status || "active",
        isActive: row.isActive !== false,
        templateId: row.templateId || "sedan_top_v1",

        thumbnailUrl: row.thumbnailUrl || null,
        thumbnailStoragePath: row.thumbnailStoragePath || null,
        thumbnailStatus: row.thumbnailStatus || "missing",
        thumbnailUploadedAt: null,

        diagramUrl: row.diagramUrl || null,
        diagramStoragePath: row.diagramStoragePath || null,
        diagramStatus: row.diagramStatus || "template",
        diagramUploadedAt: null,

        marker: row.marker || null,
        markers: Array.isArray(row.markers) ? row.markers : row.marker ? [row.marker] : [],
        markerStatus: row.markerStatus || (row.marker ? "set" : "not-assigned"),

        reportsPending: Number(row.reportsPending || 0),
        searchTokens: Array.isArray(row.searchTokens) ? row.searchTokens : [],

        sourceWorkbook: "Battery_Location_A-V_Production (2).xlsx",
        importedByScript: true,
        importedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

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

  console.log("Import complete.");
}

run().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
