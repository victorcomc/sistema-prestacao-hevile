import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Importe o axios direto
import api from '../services/api'; // Precisamos dele para configurar o token E chamar o 'me'
import { Container, Paper, TextField, Button, Typography, Box, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';

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
            const response = await axios.post('http://127.0.0.1:8000/api-token-auth/', { 
                username, 
                password 
            });
            
            const token = response.data.token;
            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Token ${token}`;

            // --- INÍCIO DA MUDANÇA ---
            
            // 5. Descobrir quem logou (Admin E Cargo)
            const userResponse = await api.get('users/me/');
            const isSuperUser = userResponse.data.is_superuser;
            
            // Pega o 'tipo' (cargo) do perfil. Usamos '?.' para segurança,
            // caso 'perfil' não exista (embora devesse).
            const userTipo = userResponse.data.perfil?.tipo; 
            
            // 6. Salvar 'isAdmin' E 'userTipo'
            localStorage.setItem('isAdmin', isSuperUser ? 'true' : 'false');
            
            if (userTipo) {
                // Salva o cargo (Ex: 'GESTOR', 'DIRETOR', 'COLABORADOR')
                localStorage.setItem('userTipo', userTipo); 
            }

            // 7. Redirecionar baseado no cargo
            if (isSuperUser) {
                navigate('/admin/viagens'); // Admin vai para a lista de gerenciamento
            } else {
                navigate('/despesas'); // Colaborador/Gestor/Diretor vai para a página de "Despesas"
            }
            // --- FIM DA MUDANÇA ---

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