import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  getIdTokenResult,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

function normalizeFirebaseError(err) {
  const code = err?.code || "";
  if (code === "auth/invalid-credential") return "Invalid email or password.";
  if (code === "auth/user-not-found") return "No account found with this email.";
  if (code === "auth/wrong-password") return "Invalid email or password.";
  if (code === "auth/too-many-requests") return "Too many attempts. Try again later.";
  return err?.message || "Something went wrong.";
}

function normalizePasswordResetError(err) {
  const code = err?.code || "";

  if (code === "auth/operation-not-allowed") {
    return "Email/password sign-in is disabled in Firebase. Enable it under Authentication → Sign-in method.";
  }

  if (
    code === "auth/invalid-api-key" ||
    code === "auth/configuration-not-found" ||
    code === "auth/project-not-found"
  ) {
    return "Firebase configuration looks invalid. Verify API key, authDomain, projectId, and authorized domains.";
  }

  if (code === "auth/invalid-continue-uri" || code === "auth/unauthorized-continue-uri") {
    return "Reset link domain is not authorized. Add this app's domain in Firebase console → Authentication → Settings → Authorized domains.";
  }

  if (code === "auth/user-not-found") {
    // Caller handles this as a silent success to avoid user enumeration.
    return "";
  }

  return err?.message || "Could not send reset email. Please try again.";
}

export async function signInAdmin(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Force refresh claims (so admin claim is available)
    const tokenResult = await getIdTokenResult(cred.user, true);
    const isAdmin = !!tokenResult?.claims?.admin;

    if (!isAdmin) {
      await signOut(auth);
      throw new Error("Access denied. This account is not an admin.");
    }

    return {
      user: cred.user,
      claims: tokenResult.claims,
      token: await cred.user.getIdToken(),
    };
  } catch (err) {
    throw new Error(normalizeFirebaseError(err));
  }
}

/**
 * Custom reset link behavior:
 * sends reset email but forces redirect to /reset-password in your app
 */
export async function sendCustomPasswordReset(email) {
  const trimmedEmail = (email || "").trim();

  if (!trimmedEmail) {
    throw new Error("Please enter your email address.");
  }
  if (!isValidEmail(trimmedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  try {
    const actionCodeSettings = {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: true,
    };

    if (import.meta.env.DEV) {
      console.log("[password-reset] actionCodeSettings.url", actionCodeSettings.url);
      console.log("[password-reset] projectId", auth?.app?.options?.projectId);
    }

    await sendPasswordResetEmail(auth, trimmedEmail, actionCodeSettings);
    return true;
  } catch (err) {
    const code = err?.code || "unknown";

    if (import.meta.env.DEV) {
      console.error("[password-reset] firebase error", code, err?.message);
    }

    if (code === "auth/user-not-found") {
      // Security: pretend success, but log in dev.
      if (import.meta.env.DEV) {
        console.warn("[password-reset] user-not-found for email", trimmedEmail);
      }
      return true;
    }

    const message = normalizePasswordResetError(err) || "Could not send reset email.";
    throw new Error(message);
  }
}

export async function logout() {
  await signOut(auth);
}
