import axios from 'axios';

export const API_URL = 'http://localhost:8000';

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


export const getMe = async () => {
    const response = await api.get('/users/me');
    return response.data;
};

// --- ARCHIVES ---
export const getSectors = async () => {
    const response = await api.get('/archives/sectors');
    return response.data;
};

export const createSector = async (data) => {
    const response = await api.post('/archives/sectors', data);
    return response.data;
};

export const updateSector = async (id, data) => {
    const response = await api.put(`/archives/sectors/${id}`, data);
    return response.data;
};

export const deleteSector = async (id) => {
    const response = await api.delete(`/archives/sectors/${id}`);
    return response.data;
};

export const getAssets = async () => {
    const response = await api.get('/archives/assets');
    return response.data;
};

export const createAsset = async (data) => {
    const response = await api.post('/archives/assets', data);
    return response.data;
};

export const updateAsset = async (id, data) => {
    const response = await api.put(`/archives/assets/${id}`, data);
    return response.data;
};

export const deleteAsset = async (id) => {
    const response = await api.delete(`/archives/assets/${id}`);
    return response.data;
};

export const getWorkers = async () => {
    const response = await api.get('/archives/workers');
    return response.data;
};

export const createWorker = async (data) => {
    const response = await api.post('/archives/workers', data);
    return response.data;
};

export const updateWorker = async (id, data) => {
    const response = await api.put(`/archives/workers/${id}`, data);
    return response.data;
};

export const deleteWorker = async (id) => {
    const response = await api.delete(`/archives/workers/${id}`);
    return response.data;
};

export const getTools = async () => {
    const response = await api.get('/archives/tools');
    return response.data;
};

export const createTool = async (data) => {
    const response = await api.post('/archives/tools', data);
    return response.data;
};

export const updateTool = async (id, data) => {
    const response = await api.put(`/archives/tools/${id}`, data);
    return response.data;
};

export const deleteTool = async (id) => {
    const response = await api.delete(`/archives/tools/${id}`);
    return response.data;
};

// --- SPARE PARTS ---
export const getSparePartCategories = async () => {
    const response = await api.get('/archives/categories');
    return response.data;
};

export const createSparePartCategory = async (data) => {
    const response = await api.post('/archives/categories', data);
    return response.data;
};

export const deleteSparePartCategory = async (id) => {
    const response = await api.delete(`/archives/categories/${id}`);
    return response.data;
};

export const getSpareParts = async () => {
    const response = await api.get('/archives/spare-parts');
    return response.data;
};

export const createSparePart = async (data) => {
    const response = await api.post('/archives/spare-parts', data);
    return response.data;
};

export const updateSparePart = async (id, data) => {
    const response = await api.put(`/archives/spare-parts/${id}`, data);
    return response.data;
};

export const deleteSparePart = async (id) => {
    const response = await api.delete(`/archives/spare-parts/${id}`);
    return response.data;
};

// --- SUPPLIERS ---
export const getSuppliers = async () => {
    const response = await api.get('/archives/suppliers');
    return response.data;
};

export const createSupplier = async (data) => {
    const response = await api.post('/archives/suppliers', data);
    return response.data;
};

export const updateSupplier = async (id, data) => {
    const response = await api.put(`/archives/suppliers/${id}`, data);
    return response.data;
};

export const deleteSupplier = async (id) => {
    const response = await api.delete(`/archives/suppliers/${id}`);
    return response.data;
};

// --- PREVENTIVE MAINTENANCE ---
export const getPreventivePlans = async () => {
    const response = await api.get('/preventive-plans');
    return response.data;
};

export const createPreventivePlan = async (data) => {
    const response = await api.post('/preventive-plans', data);
    return response.data;
};

export const deletePreventivePlan = async (id) => {
    const response = await api.delete(`/preventive-plans/${id}`);
    return response.data;
};

export const checkAndRunPreventivePlans = async () => {
    const response = await api.post('/preventive-plans/check-and-run');
    return response.data;
};

// --- WORK ORDERS ---
export const getWorkOrders = async (params = {}) => {
    // params can be { status, asset_id }
    const response = await api.get('/work-orders', { params });
    return response.data;
};

export const getWorkOrder = async (id) => {
    const response = await api.get(`/work-orders/${id}`);
    return response.data;
};

export const createWorkOrder = async (data) => {
    const response = await api.post('/work-orders', data);
    return response.data;
};

export const updateWorkOrder = async (id, data) => {
    const response = await api.put(`/work-orders/${id}`, data);
    return response.data;
};

export const getCompanySettings = async () => {
    const response = await api.get('/settings/general');
    return response.data;
};

export const updateCompanySettings = async (data) => {
    const response = await api.put('/settings/general', data);
    return response.data;
};

export const uploadCompanyLogo = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/settings/logo', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// --- DASHBOARD ---
export const getDashboardStats = async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
};

export default api;
