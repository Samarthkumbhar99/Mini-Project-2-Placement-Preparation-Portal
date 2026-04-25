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
      <form className="panel form-panel" onSubmit={handleSubmit}>
        <p className="eyebrow">{isRegister ? "Create Account" : "Welcome Back"}</p>
        <h2>{isRegister ? "Join the placement portal" : "Sign in to continue"}</h2>
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
        <button type="submit" className="primary-button">
          {isRegister ? "Create Account" : "Login"}
        </button>
      </form>
    </main>
  );
};
