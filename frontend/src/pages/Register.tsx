import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", { name, email, password });
      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1000);
    } catch (error: any) {
      setError(error.response?.data?.message || "Registration failed");
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
          <h1>Build together.<br /><span>Move faster.</span></h1>
          <p>Create a focused workspace for projects, tasks and people. Keep everyone aligned without the noise.</p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-brand"><span className="brand-mark">TF</span> TeamFlow</div>
          <h2>Create your account</h2>
          <p className="auth-subtitle">Join TeamFlow and start building with your team.</p>

          <form onSubmit={handleRegister}>
            <div className="auth-field">
              <label htmlFor="register-name">Name</label>
              <input id="register-name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email</label>
              <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Password</label>
              <input id="register-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required />
            </div>

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-success">{message}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Register;
