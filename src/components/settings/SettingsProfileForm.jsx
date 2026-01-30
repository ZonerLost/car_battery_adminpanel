import React, { useEffect, useState } from "react";
import FormRow from "../shared/FormRow";
import TextField from "../shared/TextField";
import Button from "../shared/Button";
import {
  getPlatformProfile,
  upsertPlatformProfile,
  getMyUserProfile,
  upsertMyUserProfile,
} from "../../api/settings/settingsHelper";
import { auth } from "../../lib/firebase";

const SettingsProfileForm = () => {
  const [platformValues, setPlatformValues] = useState({
    platformName: "",
    contactEmail: "",
    phone: "",
  });
  const [profileValues, setProfileValues] = useState({
    fullName: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;

    const ensureProfile = async () => {
      const existing = await getMyUserProfile();
      if (existing) return existing;

      const user = auth.currentUser;
      if (!user) return null;

      const fallbackName =
        user.displayName || (user.email ? user.email.split("@")[0] : "Admin");

      const doc = {
        fullName: fallbackName,
        email: user.email || "",
        uid: user.uid,
      };

      await upsertMyUserProfile(doc);
      return { ...doc };
    };

    (async () => {
      try {
        const [platform, me] = await Promise.all([
          getPlatformProfile(),
          ensureProfile(),
        ]);

        if (!mounted) return;

        setPlatformValues({
          platformName: platform?.platformName || "FireFighter - Super Admin",
          contactEmail: platform?.contactEmail || "",
          phone: platform?.phone || "",
        });

        setProfileValues({
          fullName: me?.fullName || "admin",
        });
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handlePlatformChange = (e) => {
    const { name, value } = e.target;
    setPlatformValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (loading) return;

    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        upsertPlatformProfile({
          platformName: platformValues.platformName,
          contactEmail: platformValues.contactEmail,
          phone: platformValues.phone,
        }),
        upsertMyUserProfile({
          fullName: profileValues.fullName,
        }),
      ]);
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSave}>
      <FormRow className="gap-4">
        <TextField
          label="Platform Name"
          name="platformName"
          value={platformValues.platformName}
          onChange={handlePlatformChange}
          disabled={loading || saving}
        />
        <TextField
          label="Full Name"
          name="fullName"
          value={profileValues.fullName}
          onChange={handleProfileChange}
          disabled={loading || saving}
        />
      </FormRow>

      <FormRow className="gap-4">
        <TextField
          label="Phone Number"
          name="phone"
          value={platformValues.phone}
          onChange={handlePlatformChange}
          disabled={loading || saving}
        />
        <TextField
          label="Contact Email"
          name="contactEmail"
          value={platformValues.contactEmail}
          onChange={handlePlatformChange}
          type="email"
          disabled={loading || saving}
        />
      </FormRow>

      <p className="text-[11px] text-slate-500">
        Stored in Firestore: settings/platform and users/{"{uid}"}
      </p>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-[11px] text-green-600">Saved</span>}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default SettingsProfileForm;
