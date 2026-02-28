import axios from "axios";

const instance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
});

console.log("Debug VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("Debug baseURL configured:", instance.defaults.baseURL);

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;