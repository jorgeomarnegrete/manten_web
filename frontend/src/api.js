import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const login = async (email, password) => {
    const response = await api.post('/token', { username: email, password }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return response.data;
};

export const register = async (companyData) => {
    const response = await api.post('/register', companyData);
    return response.data;
};

export const getPlans = async () => {
    const response = await api.get('/payments/plans');
    return response.data;
};

export const createCheckoutSession = async (planId) => {
    const response = await api.post('/payments/create-checkout-session', null, {
        params: { plan_id: planId }
    });
    return response.data;
};

export default api;
