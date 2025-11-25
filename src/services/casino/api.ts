import axios from "axios";

export const api = axios.create({
  baseURL: process.env.CASINO_BASE_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

// Request interceptor (optional)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
