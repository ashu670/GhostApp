import axios from "axios";
import toast from "react-hot-toast";

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

let isRateLimitActive = false;

instance.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url;

    if (status === 429) {
      if (!isRateLimitActive) {
        isRateLimitActive = true;

        let retryMsg = "Try again later.";
        const retryAfterSeconds = err.response?.data?.retryAfter;
        if (retryAfterSeconds) {
          const seconds = parseInt(retryAfterSeconds, 10);
          if (seconds > 0) {
              retryMsg = `Try again in ${seconds} second${seconds !== 1 ? 's' : ''}.`;
          }
        }

        toast.error(`You are temporarily blocked due to too many requests. ${retryMsg}`, {
          id: "rate-limit-toast",
          duration: 5000,
        });

        setTimeout(() => {
          isRateLimitActive = false;
        }, 5000); // 5 seconds UI cooldown
      }

      // Return unresolved promise to hang the current request silently
      // This perfectly satisfies the "silent in interceptor" request without throwing red console errors
      // and without passing garbage data to `.then()` block that would crash the app.
      return new Promise(() => {});
    }

    if (status === 404 && url && url.includes("/users/profile")) {
      // Handle the profile fetch 404 gracefully 
      return Promise.resolve({ data: null });
    }

    return Promise.reject(err);
  }
);

export default instance;