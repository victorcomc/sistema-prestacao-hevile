import axios from 'axios';

// --- INÍCIO DA CORREÇÃO ---
// 1. A baseURL DEVE incluir /api/
const productionURL = 'https://hevile-prestacao-backend.onrender.com/api/';
const developmentURL = 'http://127.0.0.1:8000/api/';
// --- FIM DA CORREÇÃO ---

const api = axios.create({
    baseURL: window.location.hostname === 'localhost' ? developmentURL : productionURL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

export default api;