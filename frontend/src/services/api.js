import axios from 'axios';

// 1. Define as URLs
const productionURL = 'https://hevile-prestacao-backend.onrender.com/api/';
const developmentURL = 'http://127.0.0.1:8000/api/';

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