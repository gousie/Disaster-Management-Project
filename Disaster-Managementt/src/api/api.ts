import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("disastra_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            const path = window.location.pathname;

            if (path !== "/" && !path.startsWith("/login")) {
                // Keep the existing token-handling behavior
            }
        }

        return Promise.reject(err);
    }
);

export default api;