/**
 * User role values stored in Firestore.
 * @typedef {"user" | "admin"} UserRole
 */

/**
 * User status values stored in Firestore.
 * @typedef {"active" | "suspended"} UserStatus
 */

/**
 * @typedef {Object} AppUser
 * @property {string} uid
 * @property {string} fullName
 * @property {string} email
 * @property {UserStatus} status
 * @property {UserRole} role
 * @property {any} [createdAt]
 * @property {any} [updatedAt]
 * @property {any} [lastActiveAt]
 */

export const DEFAULT_ROLE = "user";
export const DEFAULT_STATUS = "active";

export const ROLE_OPTIONS = [
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
];

export const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
];

/**
 * Normalize an arbitrary value into a valid UserRole.
 * @param {any} value
 * @returns {UserRole}
 */
export const sanitizeRole = (value) => {
  const v = String(value || "").toLowerCase();
  return v === "admin" ? "admin" : DEFAULT_ROLE;
};

/**
 * Normalize an arbitrary value into a valid UserStatus.
 * @param {any} value
 * @returns {UserStatus}
 */
export const sanitizeStatus = (value) => {
  const v = String(value || "").toLowerCase();
  return v === "suspended" ? "suspended" : DEFAULT_STATUS;
};

/**
 * Map Firestore snapshots or plain objects to the AppUser shape with fallbacks.
 * Safe for legacy docs missing the role field.
 *
 * @param {import("firebase/firestore").DocumentSnapshot | Partial<AppUser>} docOrData
 * @returns {AppUser}
 */
export const normalizeUserDoc = (docOrData) => {
  const base = typeof docOrData?.data === "function" ? docOrData.data() : docOrData || {};

  const uid = base.uid || docOrData?.id || base.id;
  const role = sanitizeRole(base.role);
  const status = sanitizeStatus(base.status);

  return {
    ...base,
    id: docOrData?.id || base.id || uid,
    uid,
    role,
    status,
  };
};

