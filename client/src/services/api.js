import axios from "axios";

export const api = axios.create({
  // Prefer explicit env URL, otherwise use Vite proxy (/api) in local development.
  baseURL: import.meta.env.VITE_API_URL?.trim() || "/api"
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

