import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Typography, Container, Paper, Grid, TextField, 
    Button, Stack, FormControl, InputLabel, Select, MenuItem, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box,
    IconButton, Drawer, Tooltip, OutlinedInput, Checkbox, ListItemText, InputAdornment 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function AdminArea() {
    // --- INÍCIO DA MUDANÇA ---
    const [formData, setFormData] = useState({
        username: '', password: '', first_name: '',
        last_name: '', tipo: 'COLABORADOR', 
        departamentos: [],
        foto_perfil: null,
        // email e valor_inicial removidos
    });
    // --- FIM DA MUDANÇA ---
    
    const [departamentos, setDepartamentos] = useState([]);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    const loadUsers = () => {
        api.get('users/')
            .then(res => {
                setUsers(res.data.filter(u => !u.is_superuser));
            })
            .catch(err => {
                console.error("Erro ao buscar usuários", err);
                setError("Não foi possível carregar a lista de usuários.");
            });
    };

    useEffect(() => {
        api.get('departamentos/')
            .then(res => {
                setDepartamentos(res.data);
            })
            .catch(err => {
                console.error("Erro ao buscar departamentos", err);
                setError("Não foi possível carregar a lista de departamentos.");
            });
        
        loadUsers();
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'foto_perfil') {
            setFormData(prevState => ({
                ...prevState,
                foto_perfil: files[0]
            }));
        } else if (name === 'departamentos') {
            setFormData(prevState => ({
                ...prevState,
                departamentos: typeof value === 'string' ? value.split(',') : value,
            }));
        } else {
            setFormData(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // --- INÍCIO DA MUDANÇA ---
        const payload = new FormData();
        payload.append('username', formData.username); // Este será usado como email
        payload.append('password', formData.password);
        payload.append('first_name', formData.first_name);
        payload.append('last_name', formData.last_name);
        // payload.append('email', ...) removido
        payload.append('tipo', formData.tipo);

        formData.departamentos.forEach(deptoId => {
            payload.append('departamentos', deptoId);
        });

        if (formData.foto_perfil) {
            payload.append('foto_perfil', formData.foto_perfil, formData.foto_perfil.name);
        }
        // if (formData.valor_inicial) removido
        // --- FIM DA MUDANÇA ---
        
        api.post('users/', payload, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(res => {
                setSuccess(`Usuário "${res.data.username}" criado com sucesso!`);
                // --- INÍCIO DA MUDANÇA ---
                setFormData({
                    username: '', password: '', first_name: '',
                    last_name: '', tipo: 'COLABORADOR', 
                    departamentos: [], foto_perfil: null
                });
                // --- FIM DA MUDANÇA ---
                document.getElementById('foto_perfil_input').value = null;
                loadUsers();
            })
            .catch(err => {
                console.error("Erro ao criar usuário:", err.response?.data);
                const apiError = err.response?.data?.username || "Erro desconhecido.";
                setError(`Falha ao criar usuário: ${apiError}`);
            });
    };

    const handleEditClick = (user) => {
        setUserToEdit({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            // email: user.email, // Removido
            username: user.username,
            tipo: user.perfil.tipo,
            departamentos: user.perfil.departamentos.map(d => d.id) 
        });
        setEditDrawerOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        if (name === 'departamentos') {
             setUserToEdit(prevState => ({
                ...prevState,
                departamentos: typeof value === 'string' ? value.split(',') : value,
            }));
        } else {
             setUserToEdit(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        
        // --- INÍCIO DA CORREÇÃO ---
        const payload = {
            first_name: userToEdit.first_name,
            last_name: userToEdit.last_name,
            email: userToEdit.username, // Força o email a ser igual ao username
            username: userToEdit.username,
            perfil: {
                tipo: userToEdit.tipo,
                departamentos: userToEdit.departamentos
            }
        };
        // --- FIM DA CORREÇÃO ---

        api.patch(`users/${userToEdit.id}/`, payload)
            .then(res => {
                setSuccess(`Usuário "${res.data.username}" atualizado com sucesso!`);
                setEditDrawerOpen(false);
                loadUsers();
            })
            .catch(err => {
                console.error("Erro ao atualizar usuário:", err.response.data);
                setError("Falha ao atualizar usuário.");
            });
    };

    const getDepartamentoName = (id) => {
        const depto = departamentos.find(d => d.id === id);
        return depto ? depto.nome : 'N/A';
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, pb: 8 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" color="primary" gutterBottom>
                    Gerenciamento de Usuários
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Use o formulário abaixo para criar um novo Colaborador, Gestor ou Diretor.
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        
                        {/* --- INÍCIO DA MUDANÇA (LINHA 1) --- */}
                        {/* Linha 1 (2 campos) */}
                        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                            <TextField
                                required name="first_name" label="Nome" fullWidth
                                value={formData.first_name} onChange={handleChange}
                            />
                            <TextField
                                required name="last_name" label="Sobrenome" fullWidth
                                value={formData.last_name} onChange={handleChange}
                            />
                            {/* Campo Email removido */}
                        </Stack>
                        {/* --- FIM DA MUDANÇA --- */}

                        {/* Linha 2 (3 campos) */}
                        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                            {/* --- INÍCIO DA MUDANÇA --- */}
                            <TextField
                                required name="username" label="Login (email)" type="email" fullWidth
                                value={formData.username} onChange={handleChange}
                            />
                            {/* --- FIM DA MUDANÇA --- */}
                            <TextField
                                required name="password" label="Senha" type="password" fullWidth
                                value={formData.password} onChange={handleChange}
                            />
                            <FormControl fullWidth required>
                                <InputLabel>Tipo de Perfil</InputLabel>
                                <Select
                                    name="tipo" value={formData.tipo} label="Tipo de Perfil"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="COLABORADOR">Colaborador</MenuItem>
                                    <MenuItem value="GESTOR">Gestor</MenuItem>
                                    <MenuItem value="DIRETOR">Diretor</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>

                        {/* --- INÍCIO DA MUDANÇA (LINHA 3) --- */}
                        {/* Linha 3 (2 campos) */}
                        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                            <FormControl fullWidth>
                                <InputLabel id="departamentos-label">Departamentos</InputLabel>
                                <Select
                                    labelId="departamentos-label" 
                                    name="departamentos"
                                    multiple
                                    value={formData.departamentos}
                                    onChange={handleChange}
                                    input={<OutlinedInput label="Departamentos" />}
                                    renderValue={(selectedIds) => selectedIds.map(id => getDepartamentoName(id)).join(', ')}
                                >
                                    {departamentos.map(depto => (
                                        <MenuItem key={depto.id} value={depto.id}>
                                            <Checkbox checked={formData.departamentos.indexOf(depto.id) > -1} />
                                            <ListItemText primary={depto.nome} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {/* Campo Valor Inicial removido */}
                            <Button 
                                component="label" 
                                variant="outlined" 
                                startIcon={<CloudUploadIcon />}
                                fullWidth
                                sx={{ minHeight: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                            >
                                {formData.foto_perfil ? formData.foto_perfil.name.substring(0, 15)+"..." : 'Foto de Perfil'}
                                <input 
                                    id="foto_perfil_input"
                                    type="file" 
                                    name="foto_perfil"
                                    accept="image/*"
                                    hidden 
                                    onChange={handleChange} 
                                />
                            </Button>
                        </Stack>
                        {/* --- FIM DA MUDANÇA --- */}
                        
                        {/* Botão "Criar Usuário" */}
                        <Button type="submit" variant="contained" color="primary" size="large" fullWidth sx={{ mt: 3 }}>
                            Criar Usuário
                        </Button>

                        {/* Alertas */}
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            {success && <Alert severity="success">{success}</Alert>}
                            {error && <Alert severity="error">{error}</Alert>}
                        </Stack>

                    </Stack>
                </form>
            </Paper>

            {/* --- Lista de Usuários Cadastrados --- */}
            <Paper sx={{ p: 4, mt: 4 }}>
                <Typography variant="h5" color="primary" gutterBottom>
                    Usuários Cadastrados
                </Typography>
                <TableContainer>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Nome</TableCell>
                                <TableCell>Email / Login</TableCell>
                                <TableCell>Perfil</TableCell>
                                <TableCell>Departamento</TableCell>
                                <TableCell align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {user.first_name} {user.last_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2">{user.email}</Typography>
                                            <Typography variant="caption" color="text.secondary">Login: {user.username}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{user.perfil?.tipo}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.perfil?.departamentos.map(d => d.nome).join(', ') || 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar Usuário">
                                            <IconButton color="primary" size="small" onClick={() => handleEditClick(user)}>
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* --- Drawer de Edição --- */}
            <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)} PaperProps={{ sx: { width: '400px', p: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6">Editar Usuário</Typography>
                    <IconButton onClick={() => setEditDrawerOpen(false)}><CloseIcon /></IconButton>
                </Box>
                {userToEdit && (
                    <form onSubmit={handleEditSubmit}>
                        <Stack spacing={3}>
                            <TextField
                                name="first_name" label="Nome" fullWidth
                                value={userToEdit.first_name} onChange={handleEditChange}
                            />
                            <TextField
                                name="last_name" label="Sobrenome" fullWidth
                                value={userToEdit.last_name} onChange={handleEditChange}
                            />
                            {/* --- INÍCIO DA MUDANÇA --- */}
                            {/* Campo Email removido do drawer de edição */}
                            {/* --- FIM DA MUDANÇA --- */}
                            <TextField
                                name="username" label="Login (email)" type="email" fullWidth
                                value={userToEdit.username} onChange={handleEditChange}
                            />
                            <FormControl fullWidth required>
                                <InputLabel>Tipo de Perfil</InputLabel>
                                <Select
                                    name="tipo" value={userToEdit.tipo} label="Tipo de Perfil"
                                    onChange={handleEditChange}
                                >
                                    <MenuItem value="COLABORADOR">Colaborador</MenuItem>
                                    <MenuItem value="GESTOR">Gestor</MenuItem>
                                    <MenuItem value="DIRETOR">Diretor</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth required>
                                <InputLabel id="edit-departamentos-label">Departamentos</InputLabel>
                                <Select
                                    labelId="edit-departamentos-label" 
                                    name="departamentos"
                                    multiple
                                    value={userToEdit.departamentos}
                                    onChange={handleEditChange}
                                    input={<OutlinedInput label="Departamentos" />}
                                    renderValue={(selectedIds) => selectedIds.map(id => getDepartamentoName(id)).join(', ')}
                                >
                                    {departamentos.map(depto => (
                                        <MenuItem key={depto.id} value={depto.id}>
                                            <Checkbox checked={userToEdit.departamentos.indexOf(depto.id) > -1} />
                                            <ListItemText primary={depto.nome} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button type="submit" variant="contained" color="primary" size="large" fullWidth>
                                Salvar Alterações
                            </Button>
                            <Typography variant="caption" color="text.secondary" align="center">
                                A alteração de senha e foto deve ser feita pelo usuário ou via Admin do Django.
                            </Typography>
                        </Stack>
                    </form>
                )}
            </Drawer>
        </Container>
    );
}
export default AdminArea;