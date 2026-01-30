import { readFileSync, existsSync } from "node:fs";
import process from "node:process";
import path from "node:path";

const envFiles = [
  path.resolve(".env.production"),
  path.resolve(".env.local"),
  path.resolve(".env"),
];

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  content
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#"))
    .forEach((line) => {
      const idx = line.indexOf("=");
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    });
}

envFiles.forEach(loadEnvFile);

const requiredKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
];

const missing = requiredKeys.filter((k) => !process.env[k]);

if (missing.length) {
  console.error("\n[env-check] Missing Firebase env vars:\n  - " + missing.join("\n  - "));
  console.error(
    "\nAdd them to your deployment environment (e.g., Vercel/Netlify) or to a .env.production/.env.local file before building.\n"
  );
  process.exit(1);
} else {
  console.log("[env-check] Firebase env vars look good.");
}
