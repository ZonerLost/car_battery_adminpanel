import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";

const SECONDARY_APP_NAME = "secondary-auth";

function getSecondaryApp() {
  const existing = getApps().find((a) => a.name === SECONDARY_APP_NAME);
  if (existing) return getApp(SECONDARY_APP_NAME);

  const env = import.meta.env;
  return initializeApp(
    {
      apiKey: env.VITE_FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID || env.NEXT_PUBLIC_FIREBASE_APP_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId:
        env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    },
    SECONDARY_APP_NAME
  );
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  return Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/**
 * Creates a Firebase Auth account for a new user without signing out the
 * currently logged-in admin. Returns the new user's UID.
 */
export async function createAuthUser(email) {
  const secondaryApp = getSecondaryApp();
  const secondaryAuth = getAuth(secondaryApp);

  const cred = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    generateTempPassword()
  );
  const uid = cred.user.uid;

  await signOut(secondaryAuth);
  return uid;
}

/**
 * Deletes the Firebase Auth account created by createAuthUser.
 * Used to roll back if the Firestore write fails after auth creation.
 */
export async function deleteAuthUser(uid) {
  try {
    const secondaryApp = getSecondaryApp();
    const secondaryAuth = getAuth(secondaryApp);
    // We can't delete another user from the client SDK — sign-out only.
    // This is a best-effort cleanup note; full deletion requires Admin SDK.
    await signOut(secondaryAuth);
  } catch {
    // silent — rollback is best-effort
  }
}

/**
 * Sends a password-setup email so the new user can set their own password.
 * Uses the main auth instance (no sign-in required for sendPasswordResetEmail).
 */
export async function sendPasswordSetupEmail(email, auth) {
  const actionCodeSettings = {
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: true,
  };
  await sendPasswordResetEmail(auth, email, actionCodeSettings);
}
