import { useState } from "react";
import type { FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import api from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from =
    (
      location.state as {
        from?: string;
      } | null
    )?.from || "/dashboard";

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      localStorage.setItem(
        "teamflow_token",
        response.data.token
      );

      navigate(from, {
        replace: true,
      });
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Unable to log in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT VISUAL */}
      <section className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-badge">
            <span className="brand-mark">TF</span>
            TeamFlow
          </div>

          <h1>
            Work together.
            <br />
            <span>Achieve more.</span>
          </h1>

          <p>
            TeamFlow helps teams stay organized,
            productive and connected — from the first
            task to the final delivery.
          </p>
        </div>
      </section>

      {/* LOGIN */}
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand-mark">TF</span>
            TeamFlow
          </div>

          <h2>Welcome back! 👋</h2>

          <p className="auth-subtitle">
            Login to your account and continue where
            you left off.
          </p>

          <form onSubmit={handleLogin}>
            <div className="auth-field">
              <label htmlFor="login-email">
                Email
              </label>

              <input
                id="login-email"
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

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password">
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="auth-forgot-link"
                >
                  Forgot password?
                </Link>
              </div>

              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="••••••••"
                autoComplete="current-password"
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

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/register">
              Register
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;