import React, { useEffect, useMemo, useState } from "react";

import PageContainer from "../../components/shared/PageContainer";
import SectionCard from "../../components/shared/SectionCard";

import SettingsProfileForm from "../../components/settings/SettingsProfileForm";
import TeamRolesSection from "../../components/settings/TeamRolesSection";

import AddRoleModal from "../../components/settings/AddRoleModal";
import ChangePasswordModal from "../../components/settings/ChangePasswordModal";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

import { useAuth } from "../../context/AuthContext";

import {
  subscribeTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  backfillMissingUserRoles,
} from "../../api/settings/settingsHelper";
import { DEFAULT_ROLE } from "../../types/user";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */
function formatFirestoreTimestamp(ts) {
  if (!ts) return "-";
  // Firestore Timestamp has toDate()
  const date = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

const SettingsPage = () => {
  const { isAdmin } = useAuth();

  const [membersRaw, setMembersRaw] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [userToRemove, setUserToRemove] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);

  const [savingUser, setSavingUser] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  useEffect(() => {
    const unsub = subscribeTeamMembers(
      (rows) => {
        setMembersRaw(rows);
        setMembersLoading(false);
      },
      (err) => {
        console.error("Failed to subscribe members", err);
        setMembersLoading(false);
      }
    );
    return () => unsub?.();
  }, []);

  // Map Firestore docs -> table shape
  const members = useMemo(() => {
    return membersRaw.map((u) => ({
      id: u.uid || u.id, // for table key
      uid: u.uid || u.id,
      name: u.fullName || "-",
      email: u.email || "-",
      lastActive: formatFirestoreTimestamp(u.createdAt), // you can later add lastActiveAt
      status: u.status || "active", // optional
      role: u.role || DEFAULT_ROLE,
      _raw: u,
    }));
  }, [membersRaw]);

  /* ------------------------------------------------------------------------ */
  /* Create / Edit                                                            */
  /* ------------------------------------------------------------------------ */
  const handleAddUserSubmit = async (values) => {
    setSavingUser(true);
    try {
      await createTeamMember({
        fullName: values.name,
        email: values.email,
        status: values.status,
        role: values.role || DEFAULT_ROLE,
      });
      setIsAddUserOpen(false);
    } catch (e) {
      console.error(e);
      // optionally show toast
    } finally {
      setSavingUser(false);
    }
  };

  const handleEditUserSubmit = async (values) => {
    if (!userToEdit?.uid) return;
    setSavingUser(true);
    try {
      await updateTeamMember(userToEdit.uid, {
        fullName: values.name,
        email: values.email,
        status: values.status,
        role: values.role || userToEdit.role || DEFAULT_ROLE,
      });
      setUserToEdit(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUser(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Deactivate / Remove                                                      */
  /* ------------------------------------------------------------------------ */
  const handleDeactivateConfirm = async () => {
    if (!userToDeactivate?.uid) return;
    setSavingUser(true);
    try {
      await updateTeamMember(userToDeactivate.uid, { status: "suspended" });
      setUserToDeactivate(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUser(false);
    }
  };

  const handleActivate = async (user) => {
    if (!user?.uid) return;
    setSavingUser(true);
    try {
      await updateTeamMember(user.uid, { status: "active" });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUser(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!userToRemove?.uid) return;
    setSavingUser(true);
    try {
      await deleteTeamMember(userToRemove.uid);
      setUserToRemove(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUser(false);
    }
  };

  const handleBackfillRoles = async () => {
    setBackfilling(true);
    try {
      const updatedCount = await backfillMissingUserRoles();
      if (updatedCount > 0 && import.meta.env.DEV) {
        console.log(`[backfill] added role=user to ${updatedCount} user(s)`);
      }
      if (updatedCount > 0) {
        window.alert(`Backfilled role=user for ${updatedCount} user(s).`);
      } else {
        window.alert("All users already have a role field.");
      }
    } catch (e) {
      console.error("Role backfill failed", e);
    } finally {
      setBackfilling(false);
    }
  };

  return (
    <>
      <PageContainer>
        <div className="grid grid-cols-1 gap-5">
          <SectionCard title="Platform Profile">
            <SettingsProfileForm />

            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="text-xs mt-2 font-semibold text-[#E53935] hover:underline"
            >
              Change Password
            </button>
          </SectionCard>



          <SectionCard title="Users">
            <TeamRolesSection
              loading={membersLoading}
              members={members}
              onAddUserClick={() => setIsAddUserOpen(true)}
              onDeactivateClick={(user) => setUserToDeactivate(user)}
              onActivateClick={handleActivate}
              onEditClick={(user) => setUserToEdit(user)}
              onRemoveClick={(user) => setUserToRemove(user)}
              disabled={savingUser || backfilling}
              canBackfill={isAdmin}
              onBackfillRoles={isAdmin ? handleBackfillRoles : undefined}
              backfillLoading={backfilling}
            />
          </SectionCard>
        </div>
      </PageContainer>

      {/* Add User modal (same file name, updated inside) */}
      <AddRoleModal
        isOpen={isAddUserOpen}
        mode="create"
        loading={savingUser}
        canEditRole={isAdmin}
        onClose={() => setIsAddUserOpen(false)}
        onSubmit={handleAddUserSubmit}
      />

      {/* Edit User modal */}
      <AddRoleModal
        isOpen={!!userToEdit}
        mode="edit"
        loading={savingUser}
        initialValues={
          userToEdit
            ? {
              name: userToEdit.name || "",
              email: userToEdit.email || "",
              status: userToEdit.status || "active",
              role: userToEdit.role || DEFAULT_ROLE,
            }
            : null
        }
        canEditRole={isAdmin}
        onClose={() => setUserToEdit(null)}
        onSubmit={handleEditUserSubmit}
      />

      {/* Change Password modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Deactivate confirm */}
      <ConfirmDialog
        isOpen={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivateConfirm}
        title="Deactivate User"
        description={
          userToDeactivate
            ? `Are you sure you want to deactivate ${userToDeactivate.name}? They will lose portal access.`
            : ""
        }
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        variant="danger"
        loading={savingUser}
      />

      {/* Remove confirm */}
      <ConfirmDialog
        isOpen={!!userToRemove}
        onClose={() => setUserToRemove(null)}
        onConfirm={handleRemoveConfirm}
        title="Remove User"
        description={
          userToRemove
            ? `Remove ${userToRemove.name}? This will delete their record from Firestore.`
            : ""
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        loading={savingUser}
      />
    </>
  );
};

export default SettingsPage;




