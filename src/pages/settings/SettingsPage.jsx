import React, { useState } from "react";
import PageContainer from "../../components/shared/PageContainer";
import PageHeader from "../../components/shared/PageHeader";
import SectionCard from "../../components/shared/SectionCard";
import SettingsProfileForm from "../../components/settings/SettingsProfileForm";
import SettingsPreferencesForm from "../../components/settings/SettingsPreferencesForm";
import TeamRolesSection from "../../components/settings/TeamRolesSection";
import AddRoleModal from "../../components/settings/AddRoleModal";
import ChangePasswordModal from "../../components/settings/ChangePasswordModal";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

const INITIAL_MEMBERS = [
  {
    id: 1,
    name: "Ali Khan",
    email: "ali@firefighter.com",
    role: "Manager",
    lastActive: "30 Jun 2025",
    status: "suspended",
  },
  {
    id: 2,
    name: "Sarah Altaf",
    email: "sarah@firefighter.com",
    role: "Staff",
    lastActive: "01 Jan 2025",
    status: "active",
  },
  {
    id: 3,
    name: "Khizar Azeem",
    email: "khizar@firefighter.com",
    role: "Staff",
    lastActive: "15 Feb 2025",
    status: "active",
  },
  {
    id: 4,
    name: "Iqbal Afridi",
    email: "iqbal@firefighter.com",
    role: "Staff",
    lastActive: "10 Mar 2025",
    status: "active",
  },
];

const SettingsPage = () => {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);

  const handleAddRoleSubmit = (values) => {
    setMembers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: values.name,
        email: values.email,
        role: values.role,
        lastActive: "—",
        status: "active",
      },
    ]);
    setIsAddRoleOpen(false);
  };

  const handleDeactivateConfirm = () => {
    if (!userToDeactivate) return;
    setMembers((prev) =>
      prev.map((m) =>
        m.id === userToDeactivate.id ? { ...m, status: "suspended" } : m
      )
    );
    setUserToDeactivate(null);
  };

  return (
    <>
      <PageContainer>
      
        

        {/* Top forms */}
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

          <SectionCard title="Portal & Display Preferences">
            <SettingsPreferencesForm />
          </SectionCard>

          {/* Team & Roles */}
          <SectionCard title="Team & Roles">
            <TeamRolesSection
              members={members}
              onAddUserClick={() => setIsAddRoleOpen(true)}
              onDeactivateClick={(user) => setUserToDeactivate(user)}
            />
          </SectionCard>
        </div>
      </PageContainer>

      {/* Add New Role modal */}
      <AddRoleModal
        isOpen={isAddRoleOpen}
        onClose={() => setIsAddRoleOpen(false)}
        onSubmit={handleAddRoleSubmit}
      />

      {/* Change Password modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Deactivate User confirm dialog */}
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
      />
    </>
  );
};

export default SettingsPage;
