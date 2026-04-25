import { createContext, useContext, useEffect, useState } from "react";
import { api, setAuthToken } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("portal_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("portal_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    const loadMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        localStorage.setItem("portal_user", JSON.stringify(data.user));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, [token]);

  const login = ({ token: nextToken, user: nextUser }) => {
    localStorage.setItem("portal_token", nextToken);
    localStorage.setItem("portal_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("portal_token");
    localStorage.removeItem("portal_user");
    setToken(null);
    setUser(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

