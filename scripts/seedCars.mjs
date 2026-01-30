import fs from "fs";
import path from "path";
import admin from "firebase-admin";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    const isFlag = !next || next.startsWith("--");
    args[key] = isFlag ? true : next;
    if (!isFlag) i++;
  }
  return args;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

// Small CSV parser (handles quotes)
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      row.push(cur);
      cur = "";
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((c) => String(c).trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cur += ch;
  }
  row.push(cur);
  if (row.some((c) => String(c).trim() !== "")) rows.push(row);
  return rows;
}

function parseYearRange(value) {
  const raw = String(value || "").trim();
  if (!raw) return { yearStart: null, yearEnd: null, yearRangeText: "" };

  const cleaned = raw
    .replace("–", "-")
    .replace("—", "-")
    .replace(/to/gi, "-")
    .replace(/\s+/g, "");

  const m = cleaned.match(/^(\d{4})(?:-(\d{4}))?$/);
  if (m) {
    const y1 = Number(m[1]);
    const y2 = m[2] ? Number(m[2]) : y1;
    return { yearStart: y1, yearEnd: y2, yearRangeText: y1 === y2 ? `${y1}` : `${y1}-${y2}` };
  }

  // fallback: try to find 4-digit years inside
  const years = raw.match(/\d{4}/g)?.map(Number) || [];
  if (years.length >= 1) {
    const y1 = years[0];
    const y2 = years[1] ?? years[0];
    return { yearStart: y1, yearEnd: y2, yearRangeText: y1 === y2 ? `${y1}` : `${y1}-${y2}` };
  }

  return { yearStart: null, yearEnd: null, yearRangeText: raw };
}

async function downloadToBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed download ${url} (${res.status})`);
  const arrayBuf = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  return { buffer: Buffer.from(arrayBuf), contentType };
}

function inferExtFromContentType(contentType) {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("png")) return "png";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  return "bin";
}

async function main() {
  const args = parseArgs(process.argv);

  const keyPath = args.key || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const input = args.input || "seed-data/cars.seed.csv";
  const uploadImages = Boolean(args.uploadImages);
  const dryRun = Boolean(args.dryRun);

  if (!keyPath) {
    throw new Error(
      `Missing service account key. Provide --key "C:\\path\\serviceAccount.json" OR set GOOGLE_APPLICATION_CREDENTIALS`
    );
  }
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Service account file not found: ${keyPath}`);
  }
  if (!fs.existsSync(input)) {
    throw new Error(`Seed input not found: ${input}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  const projectId = serviceAccount.project_id;
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: bucketName,
  });

  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  const carsCol = db.collection("modules").doc("carDatabase").collection("cars");

  const ext = path.extname(input).toLowerCase();
  let items = [];

  if (ext === ".json") {
    items = JSON.parse(fs.readFileSync(input, "utf8"));
    if (!Array.isArray(items)) throw new Error("JSON input must be an array");
  } else {
    const raw = fs.readFileSync(input, "utf8");
    const rows = parseCSV(raw);
    if (rows.length < 2) throw new Error("CSV must include header + at least 1 row");
    const header = rows[0].map(normalizeHeader);

    items = rows.slice(1).map((r) => {
      const obj = {};
      for (let i = 0; i < header.length; i++) obj[header[i]] = r[i] ?? "";
      return obj;
    });
  }

  // header alias helpers
  const get = (row, ...keys) => {
    for (const k of keys) {
      const nk = normalizeHeader(k);
      if (row[nk] != null && String(row[nk]).trim() !== "") return row[nk];
    }
    return "";
  };

  console.log(`Seeding cars: ${items.length}`);
  console.log(`Target: modules/carDatabase/cars`);
  console.log(`Bucket: ${bucketName}`);
  console.log(`uploadImages: ${uploadImages} | dryRun: ${dryRun}`);

  let batch = db.batch();
  let ops = 0;

  const commitBatch = async () => {
    if (ops === 0) return;
    if (!dryRun) await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (let idx = 0; idx < items.length; idx++) {
    const row = items[idx] || {};

    const make = String(get(row, "make")).trim();
    const model = String(get(row, "model")).trim();
    const yearRangeRaw = String(get(row, "yearrange", "year", "years", "yearfrom", "yearto")).trim();
    const bodyType = String(get(row, "bodytype", "type")).trim() || "Other";
    const location = String(get(row, "location", "batterylocation", "batteryposition", "details")).trim();
    const markerStatus = String(get(row, "markerstatus")).trim() || "pending";
    const status = String(get(row, "status")).trim() || "active";

    const diagramUrlRaw = String(get(row, "diagramurl", "imageurl", "diagramimageurl", "diagram")).trim();

    if (!make || !model) {
      console.warn(`Skipping row ${idx + 1}: missing make/model`);
      continue;
    }

    const { yearStart, yearEnd, yearRangeText } = parseYearRange(yearRangeRaw);

    const docId = [
      slugify(make),
      slugify(model),
      yearStart || "unknown",
      yearEnd || "unknown",
    ].join("_");

    let diagram = {
      diagramUrl: diagramUrlRaw || "",
      diagramStoragePath: "",
      diagramStatus: diagramUrlRaw ? "uploaded" : "missing",
    };

    // Optional: download external diagramUrl and upload to Storage
    if (uploadImages && diagramUrlRaw && /^https?:\/\//i.test(diagramUrlRaw)) {
      try {
        const { buffer, contentType } = await downloadToBuffer(diagramUrlRaw);
        const ext = inferExtFromContentType(contentType);
        const storagePath = `carDatabase/diagrams/${docId}.${ext}`;
        const file = bucket.file(storagePath);

        if (!dryRun) {
          await file.save(buffer, {
            contentType,
            resumable: false,
            metadata: { cacheControl: "public, max-age=31536000" },
          });
        }

        diagram.diagramStoragePath = storagePath;
        diagram.diagramStatus = "uploaded";

        // Keep diagramUrl as original; frontend can use storage path + getDownloadURL
      } catch (e) {
        console.warn(`Diagram upload failed for ${docId}: ${e.message}`);
      }
    }

    const payload = {
      make,
      model,
      bodyType,
      location,
      markerStatus,
      status,

      yearStart: yearStart ?? null,
      yearEnd: yearEnd ?? null,
      yearRangeText: yearRangeText || "",

      ...diagram,

      // helpful for search in admin/app
      searchKey: `${make} ${model} ${yearRangeText} ${bodyType}`.toLowerCase(),

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = carsCol.doc(docId);
    batch.set(ref, payload, { merge: true });
    ops++;

    // Firestore batch limit is 500
    if (ops >= 450) await commitBatch();
  }

  await commitBatch();
  console.log("✅ Cars seed completed.");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
