import { auth, db } from "../../lib/firebase"; //

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

/* -------------------------------------------------------------------------- */
/*  Collections / Docs                                                        */
/* -------------------------------------------------------------------------- */
const USERS_COL = "users";
const SETTINGS_COL = "settings";
const PLATFORM_DOC_ID = "platform";

/* -------------------------------------------------------------------------- */
/*  Current User Profile (/users/{auth.uid})                                   */
/* -------------------------------------------------------------------------- */
export async function getMyUserProfile() {
  const user = auth.currentUser;
  if (!user?.uid) throw new Error("Not authenticated");

  const ref = doc(db, USERS_COL, user.uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function upsertMyUserProfile(payload) {
  const user = auth.currentUser;
  if (!user?.uid) throw new Error("Not authenticated");

  const ref = doc(db, USERS_COL, user.uid);

  // ✅ Keep required shape (createdAt/email/fullName/uid)
  // Note: we use setDoc merge so if doc doesn't exist, it is created.
  await setDoc(
    ref,
    {
      uid: user.uid,
      fullName: payload?.fullName ?? "",
      email: payload?.email ?? user.email ?? "",
      createdAt: payload?.createdAt || serverTimestamp(),
      // optional UI field (remove if you want strictly ONLY 4 fields)
      status: payload?.status || "active",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Platform profile (singleton) Firestore doc:
 * settings/platform
 * Team users collection: users/{uid}
 */
export async function getPlatformProfile() {
  const ref = doc(db, SETTINGS_COL, PLATFORM_DOC_ID);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function upsertPlatformProfile(payload) {
  const ref = doc(db, SETTINGS_COL, PLATFORM_DOC_ID);
  await setDoc(
    ref,
    {
      platformName: payload?.platformName ?? "",
      contactEmail: payload?.contactEmail ?? "",
      phone: payload?.phone ?? "",
      updatedAt: serverTimestamp(),
      createdAt: payload?.createdAt || serverTimestamp(),
    },
    { merge: true }
  );
}

/* -------------------------------------------------------------------------- */
/*  Team Members (/users collection)                                           */
/* -------------------------------------------------------------------------- */

// Realtime subscribe for admin table
export function subscribeTeamMembers(onData, onError) {
  const q = query(collection(db, USERS_COL), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(rows);
    },
    (err) => onError?.(err)
  );
}

// ✅ Create member doc with uid = docId and save required fields
export async function createTeamMember({ fullName, email, status = "active" }) {
  const usersRef = collection(db, USERS_COL);
  const newRef = doc(usersRef); // auto-id
  const uid = newRef.id;

  await setDoc(newRef, {
    uid,
    fullName: String(fullName || "").trim(),
    email: String(email || "").trim().toLowerCase(),
    status: status || "active",
    createdAt: serverTimestamp(),
    // optional UI field (remove if you want strictly ONLY 4 fields)
  });

  return uid;
}

export async function updateTeamMember(uid, payload) {
  if (!uid) throw new Error("Missing uid");
  const ref = doc(db, USERS_COL, uid);

  // Only update allowed fields
  const next = {};
  if (payload.fullName != null) next.fullName = String(payload.fullName).trim();
  if (payload.email != null) next.email = String(payload.email).trim().toLowerCase();
  if (payload.status != null) next.status = payload.status;

  await updateDoc(ref, {
    ...next,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTeamMember(uid) {
  if (!uid) throw new Error("Missing uid");
  await deleteDoc(doc(db, USERS_COL, uid));
}

/* -------------------------------------------------------------------------- */
/*  Password Change (Firebase Auth)                                            */
/* -------------------------------------------------------------------------- */
export async function changeMyPassword({ currentPassword, newPassword }) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Not authenticated");

  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}
