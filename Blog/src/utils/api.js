import axios from 'axios';

export const baseURL = 'https://blog-website-server-h4cy.onrender.com';

const api = axios.create({
    baseURL: baseURL
});

let isRefreshing = false;
let failedQueue = [];
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (!error.response || error.response.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }
        if (error.response.status === 401 || 
            error.response.data.message === "Invalid or expired token") {
            
            originalRequest._retry = true;
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return axios(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }
            
            isRefreshing = true;
            
            try {
                const refreshToken = sessionStorage.getItem('refreshToken');
                
                if (!refreshToken) {
                    console.log("No refresh token available");
                    sessionStorage.removeItem('accountDetails');
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('refreshToken');
                    sessionStorage.removeItem('postdetails');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
                
                console.log("Attempting to refresh token...");
                const response = await axios.post(`${baseURL}/refresh-token`, {
                    refreshToken: refreshToken
                });
                
                if (response.data.accessToken) {
                    console.log("Token refreshed successfully");
                    sessionStorage.setItem('token', response.data.accessToken);
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
                    processQueue(null, response.data.accessToken);
                    return axios(originalRequest);
                } else {
                    console.log("No access token in refresh response");
                    throw new Error("Failed to refresh token");
                }
            } catch (refreshError) {
                console.error("Error refreshing token:", refreshError);
                processQueue(refreshError, null);
                sessionStorage.removeItem('accountDetails');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('refreshToken');
                sessionStorage.removeItem('postdetails');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 100);
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        return Promise.reject(error);
    }
);

export default api; 
