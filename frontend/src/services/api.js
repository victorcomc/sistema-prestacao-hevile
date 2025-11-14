import axios from 'axios';

// --- INÍCIO DA MUDANÇA ---
// 1. Define as URLs (sem /api/ no final)
const productionURL = 'https://hevile-prestacao-backend.onrender.com/';
const developmentURL = 'http://127.0.0.1:8000/';
// --- FIM DA MUDANÇA ---

const api = axios.create({
    // 2. Usa a URL de produção se o hostname NÃO for 'localhost'
    baseURL: window.location.hostname === 'localhost' ? developmentURL : productionURL,
});

// Interceptador para adicionar o token em toda requisição (continua igual)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

export default api;