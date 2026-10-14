import axios from "axios";

const api = axios.create({
baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081/api",
headers: {
"Content-Type": "application/json",
},
});

// Attach JWT token to every request
api.interceptors.request.use(
(config) => {
const token = localStorage.getItem("disastra_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
},
(error) => Promise.reject(error)

);

// Handle API errors
api.interceptors.response.use(
(response) => response,
(error) => {
if (error.response) {
// Server responded with an error status
console.error(
"API Error:",
error.response.status,
error.response.data
);
} else if (error.request) {
// Request sent, but no response received
console.error(
"Cannot connect to the server. Check Spring Boot and the API URL."
);
} else {
console.error("Request error:", error.message);
}

    return Promise.reject(error);
}

);

export default api;