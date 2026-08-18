import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setResetToken("");
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/forgot-password",
        {
          email: email.trim(),
        }
      );

      setMessage(response.data.message);

      /*
       * Development-only token.
       * Production responses deliberately do not
       * expose the token.
       */
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
      }
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to process the request."
      );
    } finally {
      setLoading(false);
    }
  };

  const continueToReset = () => {
    if (!resetToken) {
      return;
    }

    navigate(
      `/reset-password?token=${encodeURIComponent(
        resetToken
      )}`
    );
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
            Get back
            <br />
            <span>in control.</span>
          </h1>

          <p>
            Reset your password and get back to
            managing your team's work.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand-mark">TF</span>
            TeamFlow
          </div>

          <h2>Forgot your password?</h2>

          <p className="auth-subtitle">
            Enter your email and we'll help you reset
            your password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="forgot-email">
                Email
              </label>

              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
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

            {resetToken && (
              <div className="auth-dev-reset">
                <strong>
                  Development reset token
                </strong>

                <code>{resetToken}</code>

                <button
                  type="button"
                  onClick={continueToReset}
                  className="auth-submit"
                >
                  Continue to reset password
                </button>
              </div>
            )}

            {!resetToken && (
              <button
                className="auth-submit"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Sending..."
                  : "Send reset request"}
              </button>
            )}
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

export default ForgotPassword;