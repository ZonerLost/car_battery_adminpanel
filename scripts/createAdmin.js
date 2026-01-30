/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

/**
 * DEFAULT ADMIN (you asked to include email + password in script)
 * IMPORTANT: change these before running on any real project.
 */
const DEFAULT_ADMIN_EMAIL = "rashidiyaoo7@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "rashidiya";

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath =
  arg("serviceAccount") || path.join(__dirname, "serviceAccount.json");

//  If not passed from CLI, use defaults (as you requested)
const email = arg("email") || DEFAULT_ADMIN_EMAIL;
const password = arg("password") || DEFAULT_ADMIN_PASSWORD;

//  Custom reset link URL (your frontend reset page route)
const resetUrl = arg("url") || "http://localhost:5173/reset-password";

// Optional flag: always print reset link
const wantResetLink =
  process.argv.includes("--resetLink") || process.argv.includes("--print");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account not found at: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccountJson = JSON.parse(
  fs.readFileSync(serviceAccountPath, { encoding: "utf-8" })
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountJson),
});

async function main() {
  let userRecord;

  try {
    userRecord = await admin.auth().getUserByEmail(email);
    console.log(" User exists:", userRecord.uid);

    // Update password if provided/defaulted
    if (password) {
      await admin.auth().updateUser(userRecord.uid, { password });
      console.log(" Password updated.");
    }
  } catch (e) {
    // Create if not found
    userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: true, // optional
    });
    console.log(" User created:", userRecord.uid);
  }

  //  Set admin claim
  await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
  console.log(" Custom claim set: { admin: true }");

  //  Generate custom password reset link
  if (wantResetLink) {
    const actionCodeSettings = {
      url: resetUrl, // where user will land after clicking link
      handleCodeInApp: true,
    };

    const link = await admin
      .auth()
      .generatePasswordResetLink(email, actionCodeSettings);

    console.log("\n================ RESET LINK (CUSTOM) ================\n");
    console.log(link);
    console.log("\n====================================================\n");
  }

  console.log("DONE ");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
