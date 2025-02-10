import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://quizapp-production-6f2c.up.railway.app/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
