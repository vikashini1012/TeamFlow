import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import AppLayout from "../components/AppLayout";
import { useLayoutData } from "../hooks/useLayoutData";
import api from "../services/api";
import "../Account.css";

const Account = () => {
  const navigate = useNavigate();

  const {
    user,
    teams,
    layoutLoading,
    mobileMenuOpen,
    setMobileMenuOpen,
    handleLogout,
  } = useLayoutData();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    setName(user.name);
    setAvatarUrl(user.avatarUrl || "");
  }, [user]);

  const handleProfileSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setProfileMessage("");
    setPasswordMessage("");
    setError("");
    setProfileLoading(true);

    try {
      const response = await api.put("/auth/profile", {
        name,
        avatarUrl,
      });

      setName(response.data.user.name);
      setAvatarUrl(response.data.user.avatarUrl || "");
      setProfileMessage("Profile updated successfully.");
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Unable to update profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setProfileMessage("");
    setPasswordMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Unable to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  if (layoutLoading) {
    return <div className="app-loading">Loading your account...</div>;
  }

  return (
    <AppLayout
      user={user}
      teams={teams}
      activeNav="dashboard"
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuOpen={() => setMobileMenuOpen(true)}
      onMobileMenuClose={() => setMobileMenuOpen(false)}
      onLogout={handleLogout}
    >
      <main className="account-page">
        <header className="account-header">
          <div className="account-header-copy">
            <span className="page-eyebrow">ACCOUNT</span>
            <h1>Profile &amp; Security</h1>
            <p>Manage your TeamFlow profile and account security.</p>
          </div>

          <button
            type="button"
            className="account-back-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </header>

        {error && (
          <div
            className="account-message account-message-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="account-grid">
          <section className="account-card">
            <div className="account-card-header">
              <div>
                <span className="account-card-kicker">PROFILE</span>
                <h2>Personal information</h2>
                <p>Update the information shown across TeamFlow.</p>
              </div>
            </div>

            <div className="account-avatar-large" aria-hidden="true">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                name?.charAt(0).toUpperCase() || "U"
              )}
            </div>

            <form onSubmit={handleProfileSubmit} className="account-form">
              <div className="account-field">
                <label htmlFor="account-name">Full name</label>
                <input
                  id="account-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="account-field">
                <label htmlFor="account-email">Email</label>
                <input
                  id="account-email"
                  value={user?.email || ""}
                  disabled
                />
                <small>Email changes are disabled for now.</small>
              </div>

              <div className="account-field">
                <label htmlFor="account-avatar">Avatar URL</label>
                <input
                  id="account-avatar"
                  type="url"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <button
                type="submit"
                className="account-primary-button"
                disabled={profileLoading}
              >
                {profileLoading ? "Saving..." : "Save profile"}
              </button>

              {profileMessage && (
                <div className="account-message account-message-success">
                  {profileMessage}
                </div>
              )}
            </form>
          </section>

          <section className="account-card">
            <div className="account-card-header">
              <div>
                <span className="account-card-kicker">SECURITY</span>
                <h2>Change password</h2>
                <p>
                  Keep your TeamFlow account secure with a strong password.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="account-form">
              <div className="account-field">
                <label htmlFor="current-password">Current password</label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="account-field">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
                <small>Minimum 6 characters.</small>
              </div>

              <div className="account-field">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="account-primary-button"
                disabled={passwordLoading}
              >
                {passwordLoading ? "Changing..." : "Change password"}
              </button>

              {passwordMessage && (
                <div className="account-message account-message-success">
                  {passwordMessage}
                </div>
              )}
            </form>
          </section>
        </div>
      </main>
    </AppLayout>
  );
};

export default Account;