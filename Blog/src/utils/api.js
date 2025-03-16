import axios from 'axios';

// Local development URL
export const baseURL = 'https://blog-website-server-h4cy.onrender.com';

const api = axios.create({
    baseURL: baseURL
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue = [];

// Process the queue of failed requests
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

// Add a request interceptor to include the token in all requests
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

// Add a response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // If the error is not 401 or the request has already been retried, reject
        if (!error.response || error.response.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }
        
        // If the error message indicates token expiration
        if (error.response.status === 401 || 
            error.response.data.message === "Invalid or expired token") {
            
            originalRequest._retry = true;
            
            // If already refreshing, add to queue
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
                    // No refresh token, clear session and redirect to login
                    sessionStorage.removeItem('accountDetails');
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('refreshToken');
                    sessionStorage.removeItem('postdetails');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
                
                console.log("Attempting to refresh token...");
                // Try to get a new token
                const response = await axios.post(`${baseURL}/refresh-token`, {
                    refreshToken: refreshToken
                });
                
                if (response.data.accessToken) {
                    console.log("Token refreshed successfully");
                    // Store the new token
                    sessionStorage.setItem('token', response.data.accessToken);
                    
                    // Update authorization header for the original request
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
                    
                    // Process the queue with the new token
                    processQueue(null, response.data.accessToken);
                    
                    // Return the original request with the new token
                    return axios(originalRequest);
                } else {
                    console.log("No access token in refresh response");
                    throw new Error("Failed to refresh token");
                }
            } catch (refreshError) {
                console.error("Error refreshing token:", refreshError);
                // Process the queue with the error
                processQueue(refreshError, null);
                
                // Clear session and redirect to login
                sessionStorage.removeItem('accountDetails');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('refreshToken');
                sessionStorage.removeItem('postdetails');
                
                // Add a small delay before redirecting to avoid multiple redirects
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
