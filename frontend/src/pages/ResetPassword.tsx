import { useState } from "react";
import type { FormEvent } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../services/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError(
        "This password reset link is missing its token."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/auth/reset-password",
        {
          token,
          newPassword,
          confirmPassword,
        }
      );

      setMessage(response.data.message);

      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1500);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to reset your password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-badge">
            <span className="brand-mark">TF</span>
            TeamFlow
          </div>

          <h1>
            A fresh start.
            <br />
            <span>Stay secure.</span>
          </h1>

          <p>
            Choose a strong password and continue
            working with your team.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand-mark">TF</span>
            TeamFlow
          </div>

          <h2>Reset password</h2>

          <p className="auth-subtitle">
            Choose a new password for your TeamFlow
            account.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="reset-password">
                New password
              </label>

              <input
                id="reset-password"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="reset-confirm-password">
                Confirm password
              </label>

              <input
                id="reset-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            {error && (
              <div
                className="auth-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {message && (
              <div className="auth-success">
                {message}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading || !token}
            >
              {loading
                ? "Resetting..."
                : "Reset password"}
            </button>
          </form>

          <p className="auth-switch">
            Remember your password?{" "}
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default ResetPassword;