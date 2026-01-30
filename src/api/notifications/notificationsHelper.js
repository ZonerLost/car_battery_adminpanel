import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

const notificationsCol = collection(db, "notifications");
const usersCol = collection(db, "users");

/**
 * Create a single notification document.
 * Keeps schema: { event, title, body, data, recipientId, createdAt, isRead, type }
 */
export async function createNotification(payload) {
  if (!payload?.recipientId) throw new Error("Missing recipientId for notification");

  const doc = {
    event: payload.event || "general",
    title: payload.title || "",
    body: payload.body || "",
    data: payload.data || null,
    type: payload.type || "info",
    recipientId: payload.recipientId,
    isRead: false,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(notificationsCol, doc);
  return ref.id;
}

/**
 * Fetch UIDs for all admins based on users.role === "admin".
 * Legacy docs without role are excluded by design.
 */
export async function getAdminUids() {
  const snap = await getDocs(query(usersCol, where("role", "==", "admin")));
  return snap.docs.map((d) => d.id || d.data()?.uid).filter(Boolean);
}

/**
 * Fan out a notification payload to every admin.
 * The payload should omit recipientId; it is injected per admin.
 */
export async function notifyAdmins(payload) {
  const adminUids = await getAdminUids();
  if (!adminUids.length) return [];

  const tasks = adminUids.map((uid) => createNotification({ ...payload, recipientId: uid }));
  return Promise.all(tasks);
}

