import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const AuthPage = ({ mode }) => {
  const isRegister = mode === "register";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister ? form : { email: form.email, password: form.password };
      const { data } = await api.post(endpoint, payload);
      login(data);
      navigate(data.user.role === "admin" ? "/admin" : "/student");
    } catch (requestError) {
      if (!requestError.response) {
        setError("Cannot connect to server. Start backend and check API URL.");
        return;
      }
      setError(requestError.response?.data?.message || "Request failed.");
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-brand-header">
        <div className="auth-logo-badge" aria-hidden="true">
          PP
        </div>
        <div>
          <p className="eyebrow">Placement Portal</p>
          <h2>{isRegister ? "Create your profile and get started" : "Welcome back to your placement workspace"}</h2>
          <p className="auth-brand-copy">
            AI-powered readiness insights, company matching, and interview guidance in one place.
          </p>
        </div>
      </section>
      <form className="auth-form-panel auth-form-standalone" onSubmit={handleSubmit}>
        <h3>{isRegister ? "Create your account" : "Sign in to your account"}</h3>
        {error ? <p className="error-text">{error}</p> : null}
        {isRegister && (
          <label>
            Full Name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        <button type="submit" className="primary-button auth-submit">
          {isRegister ? "Create Account" : "Login"}
        </button>
      </form>
    </main>
  );
};
