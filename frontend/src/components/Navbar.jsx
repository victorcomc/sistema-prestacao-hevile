import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    
    const isAdmin = localStorage.getItem('isAdmin') === 'true'; 
    const userTipo = localStorage.getItem('userTipo'); 

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin'); 
        localStorage.removeItem('userTipo'); 
        navigate('/login');
    };

    return (
        <AppBar position="static" elevation={0}>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ minHeight: '70px' }}>
                    {/* LOGO / NOME */}
                    <Typography
                        variant="h5"
                        noWrap
                        component={Link}
                        to={isAdmin ? "/admin/viagens" : "/despesas"} 
                        sx={{
                            mr: 4,
                            fontWeight: 800,
                            color: '#ff671f',
                            textDecoration: 'none',
                            letterSpacing: '.05rem',
                        }}
                    >
                        HEVILE
                        <Typography component="span" variant="body2" sx={{ color: '#ffffff', ml: 1, opacity: 0.7, fontWeight: 400 }}>
                            | Prestação de Contas
                        </Typography>
                    </Typography>

                    {/* MENU */}
                    <Box sx={{ flexGrow: 1, display: 'flex', gap: 1, ml: 4 }}>
                        
                        {/* --- INÍCIO DA MUDANÇA --- */}
                        {/* Links do Colaborador (Não-Admin) */}
                        {!isAdmin && (
                            <Button 
                                component={Link} 
                                to="/despesas" 
                                sx={{ color: 'white', fontSize: '1rem' }}
                            >
                                Meu Perfil 
                            </Button>
                        )}
                        {/* --- FIM DA MUDANÇA --- */}

                        {/* Link "Gerenciar Viagens" para Gestores e Diretores (que não são Admins) */}
                        {(!isAdmin && (userTipo === 'GESTOR' || userTipo === 'DIRETOR')) && (
                            <Button 
                                component={Link} 
                                to="/admin/viagens"
                                sx={{ color: 'white', fontSize: '1rem' }}
                            >
                                Gerenciar Viagens
                            </Button>
                        )}


                        {/* Links do Admin (is_superuser) */}
                        {isAdmin && (
                            <>
                                <Button 
                                    component={Link} 
                                    to="/admin/viagens"
                                    sx={{ color: 'white', fontSize: '1rem' }}
                                >
                                    Gerenciar Viagens
                                </Button>
                                
                                <Button 
                                    component={Link} 
                                    to="/admin"
                                    sx={{ color: 'white', fontSize: '1rem' }}
                                >
                                    Usuarios
                                </Button>
                                <Button 
                                    component={Link} 
                                    to="/admin/depositos"
                                    sx={{ color: 'white', fontSize: '1rem' }}
                                >
                                    Depositos
                                </Button>
                            </>
                        )}
                    </Box>

                    {/* SAIR */}
                    <Box sx={{ flexGrow: 0 }}>
                        <Button 
                            variant="outlined" 
                            color="error" 
                            onClick={handleLogout}
                        >
                            Sair
                        </Button>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export default Navbar;