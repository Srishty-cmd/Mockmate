import { useEffect, useMemo, useState } from "react";
import { changePassword, deleteAccount, getUserProfile, updateUserProfile, updateUserSettings } from "../utils/api";
import { logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";

const DEFAULT_SETTINGS = {
  theme: "dark",
  notifications: {
    email: true,
    push: true,
    productUpdates: true
  },
  privacy: {
    profileVisibility: "public",
    showEmail: false,
    showPhone: false
  },
  integrations: {
    openaiApiKey: "",
    githubConnected: false,
    slackConnected: false
  }
};

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    phone: "",
    profileImage: ""
  });

  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        const user = data.user || {};
        setProfileForm({
          name: user.name || "",
          bio: user.bio || "",
          phone: user.phone || "",
          profileImage: user.profileImage || ""
        });
        setSettingsForm({
          ...DEFAULT_SETTINGS,
          ...(user.settings || {}),
          notifications: {
            ...DEFAULT_SETTINGS.notifications,
            ...(user.settings?.notifications || {})
          },
          privacy: {
            ...DEFAULT_SETTINGS.privacy,
            ...(user.settings?.privacy || {})
          },
          integrations: {
            ...DEFAULT_SETTINGS.integrations,
            ...(user.settings?.integrations || {})
          }
        });
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const apiKeyPreview = useMemo(() => {
    const key = settingsForm.integrations.openaiApiKey || "";
    if (!key) return "Not set";
    if (key.length <= 10) return "*".repeat(key.length);
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  }, [settingsForm.integrations.openaiApiKey]);

  const updateTheme = (theme) => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setError("");
      setSuccess("");
      const { user } = await updateUserProfile(profileForm);
      localStorage.setItem("currentUser", user.name || "User");
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Profile update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setError("");
      setSuccess("");
      await updateUserSettings(settingsForm);
      updateTheme(settingsForm.theme);
      setSuccess("Settings updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Settings update failed");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password must match");
      return;
    }
    try {
      setSavingPassword(true);
      setError("");
      setSuccess("");
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess("Password updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Password update failed");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Delete account permanently? This cannot be undone.");
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");
      setSuccess("");
      await deleteAccount();
      logout();
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || "Account deletion failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-300">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage account, privacy and app preferences.</p>
      </div>

      {error && <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300">{success}</div>}

      <form onSubmit={handleSaveProfile} className="space-y-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile fields</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <input className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2" placeholder="Name" value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} />
          <input className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2" placeholder="Phone" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
        </div>
        <input className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2" placeholder="Avatar URL" value={profileForm.profileImage} onChange={(e) => setProfileForm((p) => ({ ...p, profileImage: e.target.value }))} />
        <textarea className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2" rows="3" placeholder="Bio" value={profileForm.bio} onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))} />
        <button disabled={savingProfile} className="rounded-lg bg-purple-600 text-white px-4 py-2 hover:bg-purple-700 disabled:opacity-60">{savingProfile ? "Saving..." : "Save profile"}</button>
      </form>

      <form onSubmit={handleSaveSettings} className="space-y-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">App preferences</h2>

        <div>
          <p className="font-medium mb-2">Theme toggle</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setSettingsForm((s) => ({ ...s, theme: "light" }))} className={`px-4 py-2 rounded-lg border ${settingsForm.theme === "light" ? "border-purple-500 bg-purple-50 dark:bg-purple-500/20" : "border-gray-300 dark:border-gray-700"}`}>Light</button>
            <button type="button" onClick={() => setSettingsForm((s) => ({ ...s, theme: "dark" }))} className={`px-4 py-2 rounded-lg border ${settingsForm.theme === "dark" ? "border-purple-500 bg-purple-50 dark:bg-purple-500/20" : "border-gray-300 dark:border-gray-700"}`}>Dark</button>
          </div>
        </div>

        <div>
          <p className="font-medium mb-2">Notification preferences</p>
          <div className="space-y-2">
            {[
              ["email", "Email notifications"],
              ["push", "Push notifications"],
              ["productUpdates", "Product updates"]
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={Boolean(settingsForm.notifications[key])} onChange={(e) => setSettingsForm((s) => ({ ...s, notifications: { ...s.notifications, [key]: e.target.checked } }))} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="font-medium mb-2">Privacy controls</p>
          <div className="space-y-2">
            <label className="block">
              <span className="mr-2">Profile visibility</span>
              <select className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2" value={settingsForm.privacy.profileVisibility} onChange={(e) => setSettingsForm((s) => ({ ...s, privacy: { ...s.privacy, profileVisibility: e.target.value } }))}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={Boolean(settingsForm.privacy.showEmail)} onChange={(e) => setSettingsForm((s) => ({ ...s, privacy: { ...s.privacy, showEmail: e.target.checked } }))} />
              <span>Show email on profile</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={Boolean(settingsForm.privacy.showPhone)} onChange={(e) => setSettingsForm((s) => ({ ...s, privacy: { ...s.privacy, showPhone: e.target.checked } }))} />
              <span>Show phone on profile</span>
            </label>
          </div>
        </div>

        <div>
          <p className="font-medium mb-2">API key / integrations</p>
          <div className="space-y-2">
            <input className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2" placeholder="OpenAI API key" value={settingsForm.integrations.openaiApiKey} onChange={(e) => setSettingsForm((s) => ({ ...s, integrations: { ...s.integrations, openaiApiKey: e.target.value } }))} />
            <p className="text-sm text-gray-500 dark:text-gray-400">Saved key: {apiKeyPreview}</p>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={Boolean(settingsForm.integrations.githubConnected)} onChange={(e) => setSettingsForm((s) => ({ ...s, integrations: { ...s.integrations, githubConnected: e.target.checked } }))} />
              <span>GitHub connected</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={Boolean(settingsForm.integrations.slackConnected)} onChange={(e) => setSettingsForm((s) => ({ ...s, integrations: { ...s.integrations, slackConnected: e.target.checked } }))} />
              <span>Slack connected</span>
            </label>
          </div>
        </div>

        <button disabled={savingSettings} className="rounded-lg bg-purple-600 text-white px-4 py-2 hover:bg-purple-700 disabled:opacity-60">{savingSettings ? "Saving..." : "Save preferences"}</button>
      </form>

      <form onSubmit={handleChangePassword} className="space-y-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Change password</h2>
        <input type="password" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2" placeholder="Current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} />
        <input type="password" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2" placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} />
        <input type="password" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2" placeholder="Confirm new password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))} />
        <button disabled={savingPassword} className="rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-60">{savingPassword ? "Updating..." : "Update password"}</button>
      </form>

      <div className="rounded-2xl border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-5">
        <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">Delete account</h2>
        <p className="text-sm text-red-700/80 dark:text-red-200/80 mt-1 mb-3">This permanently removes your account and interview history.</p>
        <button onClick={handleDeleteAccount} disabled={deleting} className="rounded-lg bg-red-600 text-white px-4 py-2 hover:bg-red-700 disabled:opacity-60">{deleting ? "Deleting..." : "Delete account"}</button>
      </div>
    </div>
  );
}
