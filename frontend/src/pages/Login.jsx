import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios'; // Não precisamos mais do axios direto
import api from '../services/api'; // Esta é a nossa instância principal (para /api/...)
import { Container, Paper, TextField, Button, Typography, Box, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// --- INÍCIO DA CORREÇÃO ---
// 1. Criamos uma URL raiz separada SÓ PARA O LOGIN
const rootURL = window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:8000/' 
    : 'https://hevile-prestacao-backend.onrender.com/';
// --- FIM DA CORREÇÃO ---


function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const theme = useTheme();

    const handleLogin = async (e) => {
        e.preventDefault(); 
        setError('');

        try {
            // --- INÍCIO DA CORREÇÃO ---
            // 2. Fazemos a chamada de login para a ROTA RAIZ
            //    usando a URL que acabamos de definir.
            const response = await api.post(`${rootURL}api-token-auth/`, { 
                username, 
                password 
            });
            // --- FIM DA CORREÇÃO ---
            
            const token = response.data.token;
            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Token ${token}`;

            // --- INÍCIO DA CORREÇÃO ---
            // 3. Esta chamada usa a instância 'api' normal (que já tem /api/ na baseURL)
            const userResponse = await api.get('users/me/'); 
            // --- FIM DA CORREÇÃO ---
            
            const isSuperUser = userResponse.data.is_superuser;
            const userTipo = userResponse.data.perfil?.tipo; 
            
            localStorage.setItem('isAdmin', isSuperUser ? 'true' : 'false');
            
            if (userTipo) {
                localStorage.setItem('userTipo', userTipo); 
            }

            if (isSuperUser) {
                navigate('/admin/viagens');
            } else {
                navigate('/despesas');
            }

        } catch (err) {
            console.error("Erro no login:", err);
            setError('Usuário ou senha inválidos.');
        }
    };

    return (
        <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={10} sx={{ p: 4, width: '100%' }}>
                <Typography 
                    variant="h5" 
                    align="center" 
                    gutterBottom 
                    color="primary"
                    sx={{ fontWeight: 'bold' }}
                >
                    HEVILE | Prestação
                </Typography>
                <Typography variant="body2" align="center" sx={{ mb: 3 }} color="text.secondary">
                    Entre com suas credenciais
                </Typography>

                <form onSubmit={handleLogin}>
                    <TextField
                        label="Usuário" 
                        variant="outlined" 
                        fullWidth 
                        margin="normal"
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        label="Senha" 
                        type="password" 
                        variant="outlined" 
                        fullWidth 
                        margin="normal"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                    <Button 
                        type="submit" 
                        fullWidth 
                        variant="contained" 
                        size="large"
                        sx={{ mt: 3, mb: 2, fontSize: '1.1rem' }}
                    >
                        Entrar
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}

export default Login;