import fs from "fs";
import path from "path";
import process from "process";

import admin from "firebase-admin";

const FILE = process.argv[2] || "seed-data/reports.seed.json";

async function main() {
  // 1) Init admin SDK (needs GOOGLE_APPLICATION_CREDENTIALS)
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  const db = admin.firestore();

  // 2) Read file
  const abs = path.resolve(FILE);
  if (!fs.existsSync(abs)) {
    throw new Error(`Seed file not found: ${abs}`);
  }

  const raw = fs.readFileSync(abs, "utf-8");
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Seed file is empty or not an array.");
  }

  console.log(`Seeding ${items.length} reports from: ${abs}`);

  const batchSize = 400; // Firestore batch limit is 500
  let batch = db.batch();
  let op = 0;
  let total = 0;

  for (const r of items) {
    if (!r?.id) continue;

    const ref = db.doc(`modules/feedbackReports/reports/${r.id}`);

    // Normalize shape for your UI (admin table + modal)
    const doc = {
      id: r.id,
      type: r.type || "General Feedback",
      car: r.car || `${r.make || ""} ${r.model || ""} ${r.year || ""}`.trim(),
      make: r.make || null,
      model: r.model || null,
      year: r.year || null,

      submittedBy: r.submittedBy || null,
      createdByUid: r.createdByUid || null,

      category: r.category || null, // only for General Feedback
      correctArea: r.correctArea || null, // for Incorrect Location
      reportedArea: r.reportedArea || null, // optional
      message: r.message || "",
      status: r.status || "pending", // pending | approved | rejected

      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      updatedAt: new Date(),
    };

    batch.set(ref, doc, { merge: true });
    op++;
    total++;

    if (op >= batchSize) {
      await batch.commit();
      console.log(`Committed batch of ${op}`);
      batch = db.batch();
      op = 0;
    }
  }

  if (op > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${op}`);
  }

  console.log(`✅ Done. Seeded ${total} reports.`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
