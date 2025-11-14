import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Drawer,
  Box,
  TextField,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  IconButton,
  Switch,
  Tooltip,
  Alert // <<< 1. IMPORTAR Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { Link } from 'react-router-dom';

const formatarData = (dataString) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
};

function Viagens() {
  const [viagens, setViagens] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  // --- Estados do Drawer de CRIAÇÃO ---
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [novaViagem, setNovaViagem] = useState({
    titulo: '',
    data_inicio: '',
    data_fim: '',
    participantes: []
  });

  // --- Estados do Drawer de EDIÇÃO ---
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [viagemParaEditar, setViagemParaEditar] = useState({
    id: null,
    titulo: '',
    data_inicio: '',
    data_fim: '',
    participantes: []
  });

  // --- INÍCIO DA MUDANÇA (Validação) ---
  const [formError, setFormError] = useState(''); // 2. NOVO ESTADO
  // --- FIM DA MUDANÇA ---

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    loadViagens();
    if (isAdmin) {
      loadUsuarios();
    }
  }, [isAdmin, mostrarTodos]);

  const loadUserData = () => {
    api.get('users/me/')
      .then(response => {
        setIsAdmin(response.data.is_superuser);
      })
      .catch(error => console.error("Erro ao carregar usuário:", error));
  };

  const loadViagens = () => {
    const filtro = mostrarTodos ? 'todos' : 'pendentes';
    api.get(`viagens/?filtro=${filtro}`)
      .then(response => setViagens(response.data))
      .catch(error => console.error("Erro ao carregar viagens:", error));
  };

  const loadUsuarios = () => {
    api.get('users/')
      .then(response => setUsuarios(response.data))
      .catch(error => console.error("Erro ao carregar usuários:", error));
  };

  // --- Funções do Drawer de CRIAÇÃO ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaViagem({ ...novaViagem, [name]: value });
  };

  const handleParticipanteChange = (userId) => {
    const current = novaViagem.participantes;
    setNovaViagem({
      ...novaViagem,
      participantes: current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId]
    });
  };

  // --- INÍCIO DA MUDANÇA (Validação) ---
  const handleSubmit = () => {
    setFormError(''); // Limpa erros antigos

    // 3. Validação
    if (!novaViagem.titulo || !novaViagem.data_inicio || !novaViagem.data_fim) {
        setFormError('Todos os campos de texto são obrigatórios.');
        return;
    }
    if (novaViagem.participantes.length === 0) {
        setFormError('Selecione pelo menos um participante.');
        return;
    }
    
    api.post('viagens/', novaViagem)
      .then(response => {
        alert("Viagem criada com sucesso!");
        setDrawerOpen(false);
        loadViagens();
        setNovaViagem({ titulo: '', data_inicio: '', data_fim: '', participantes: [] });
        setFormError(''); // Limpa o erro
      })
      .catch(error => {
        console.error("Erro ao criar viagem:", error);
        setFormError("Erro ao criar viagem. Verifique os dados.");
      });
  };
  // --- FIM DA MUDANÇA ---

  // --- Funções do Drawer de EDIÇÃO ---
  const handleEditClick = (viagem) => {
    setFormError(''); // Limpa erros
    setViagemParaEditar({
        id: viagem.id,
        titulo: viagem.titulo,
        data_inicio: viagem.data_inicio,
        data_fim: viagem.data_fim,
        participantes: viagem.participantes_detalhes.map(p => p.id) 
    });
    setEditDrawerOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setViagemParaEditar({ ...viagemParaEditar, [name]: value });
  };

  const handleEditParticipanteChange = (userId) => {
    const current = viagemParaEditar.participantes;
    setViagemParaEditar({
      ...viagemParaEditar,
      participantes: current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId]
    });
  };

  // --- INÍCIO DA MUDANÇA (Validação) ---
  const handleEditSubmit = () => {
    setFormError(''); // Limpa erros antigos

    // Validação
    if (!viagemParaEditar.titulo || !viagemParaEditar.data_inicio || !viagemParaEditar.data_fim) {
        setFormError('Todos os campos de texto são obrigatórios.');
        return;
    }
    if (viagemParaEditar.participantes.length === 0) {
        setFormError('Selecione pelo menos um participante.');
        return;
    }

    const { id, ...payload } = viagemParaEditar;
    
    api.patch(`viagens/${id}/`, payload)
      .then(response => {
        alert("Viagem atualizada com sucesso!");
        setEditDrawerOpen(false);
        loadViagens();
        setFormError(''); // Limpa o erro
      })
      .catch(error => {
        console.error("Erro ao atualizar viagem:", error);
        setFormError("Erro ao atualizar viagem. Verifique os dados.");
      });
  };
  // --- FIM DA MUDANÇA ---


  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      {isAdmin && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            backgroundColor: '#ff5722',
            color: 'white',
            width: '100%',
            padding: '12px',
            fontSize: '1.1rem',
            marginBottom: 4,
            '&:hover': { backgroundColor: '#e64a19' }
          }}
          onClick={() => { setDrawerOpen(true); setFormError(''); }} // 4. Limpa o erro ao abrir
        >
          Criar nova viagem
        </Button>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'white', mb: 0 }}>
          {isAdmin ? 'Gerenciar Viagens' : 'Aprovar Despesas'}
        </Typography>
        {!isAdmin && (
            <FormControlLabel
                control={
                <Switch
                    checked={mostrarTodos}
                    onChange={(e) => setMostrarTodos(e.target.checked)}
                    color="primary"
                />
                }
                label="Mostrar histórico de viagens"
                sx={{ color: '#999' }}
            />
        )}
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: '#1e1e1e' }}>
        <Table sx={{ minWidth: 650 }} aria-label="tabela de viagens">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#999' }}>STATUS</TableCell>
              <TableCell sx={{ color: '#999' }}>NOME DA VIAGEM</TableCell>
              <TableCell sx={{ color: '#999' }}>DATA INÍCIO</TableCell>
              <TableCell sx={{ color: '#999' }}>DATA FIM</TableCell>
              {isAdmin && <TableCell sx={{ color: '#999' }} align="right">AÇÕES</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {viagens.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} align="center" sx={{ color: '#aaa', py: 5 }}>
                        <Typography variant="h6">
                            {isAdmin ? 'Nenhuma viagem criada.' 
                                     : (mostrarTodos ? 'Nenhum histórico de viagem encontrado.' : 'Não há mais despesas para serem aprovadas.')}
                        </Typography>
                    </TableCell>
                </TableRow>
            ) : (
                viagens.map((viagem) => (
                    <TableRow key={viagem.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    
                    <TableCell sx={{ color: 'white' }}>{viagem.status_dinamico}</TableCell>
                    
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        <Link
                        to={`/admin/viagens/${viagem.id}`}
                        style={{ color: '#ff5722', textDecoration: 'none' }}
                        >
                        {viagem.titulo}
                        </Link>
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>{formatarData(viagem.data_inicio)}</TableCell>
                    <TableCell sx={{ color: 'white' }}>{formatarData(viagem.data_fim)}</TableCell>

                    {isAdmin && (
                        <TableCell align="right">
                            <Tooltip title="Editar Viagem">
                                <IconButton color="primary" size="small" onClick={() => handleEditClick(viagem)}>
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                        </TableCell>
                    )}
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Drawer de CRIAÇÃO */}
      {isAdmin && (
        <Drawer
            anchor="right"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            PaperProps={{ sx: { width: '400px', backgroundColor: '#222', color: 'white', padding: 3 } }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <Typography variant="h6">Adicionar Viagem</Typography>
                <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: '#999' }}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <Stack spacing={3}>
                {/* --- INÍCIO DA MUDANÇA (Validação) --- */}
                {formError && <Alert severity="error">{formError}</Alert>}

                <TextField
                    label="Nome da Viagem" name="titulo" value={novaViagem.titulo} onChange={handleInputChange}
                    required // 5. Adicionado
                    error={!!(formError && !novaViagem.titulo)} // 5. Adicionado
                    fullWidth InputLabelProps={{ sx: { color: '#999' } }} InputProps={{ sx: { color: 'white' } }}
                    sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#555' } }}
                />
                <TextField
                    label="Data de Início" name="data_inicio" value={novaViagem.data_inicio} onChange={handleInputChange}
                    required // 5. Adicionado
                    error={!!(formError && !novaViagem.data_inicio)} // 5. Adicionado
                    type="date" fullWidth InputLabelProps={{ shrink: true, sx: { color: '#999' } }} InputProps={{ sx: { color: 'white' } }}
                    sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#555' } }}
                />
                <TextField
                    label="Data de Fim" name="data_fim" value={novaViagem.data_fim} onChange={handleInputChange}
                    required // 5. Adicionado
                    error={!!(formError && !novaViagem.data_fim)} // 5. Adicionado
                    type="date" fullWidth InputLabelProps={{ shrink: true, sx: { color: '#999' } }} InputProps={{ sx: { color: 'white' } }}
                    sx={{ '& .MiiOutlinedInput-root fieldset': { borderColor: '#555' } }}
                />
                <Box>
                    <FormLabel component="legend" sx={{ color: 'white', marginBottom: 1 }} error={!!(formError && novaViagem.participantes.length === 0)}> {/* 5. Adicionado */}
                        Participantes *
                    </FormLabel>
                    <FormGroup sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {usuarios.map(user => (
                        <FormControlLabel
                        key={user.id}
                        control={
                            <Checkbox
                            sx={{ color: '#555', '&.Mui-checked': { color: '#ff5722' } }}
                            checked={novaViagem.participantes.includes(user.id)}
                            onChange={() => handleParticipanteChange(user.id)}
                            />
                        }
                        // --- INÍCIO DA MUDANÇA (Nome) ---
                        label={`${user.first_name} ${user.last_name}`} // 6. Nome completo
                        // --- FIM DA MUDANÇA ---
                        sx={{ color: '#ccc' }}
                        />
                    ))}
                    </FormGroup>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, marginTop: 4 }}>
                    <Button variant="contained" fullWidth sx={{ backgroundColor: '#ff5722', '&:hover': { backgroundColor: '#e64a19' } }} onClick={handleSubmit}>
                        Enviar
                    </Button>
                    <Button variant="outlined" fullWidth sx={{ color: '#999', borderColor: '#555', '&:hover': { borderColor: '#777' } }} onClick={() => setDrawerOpen(false)}>
                        Cancelar
                    </Button>
                </Box>
            </Stack>
        </Drawer>
      )}

      {/* Drawer de EDIÇÃO */}
      {isAdmin && (
        <Drawer
            anchor="right"
            open={editDrawerOpen}
            onClose={() => setEditDrawerOpen(false)}
            PaperProps={{ sx: { width: '400px', backgroundColor: '#222', color: 'white', padding: 3 } }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <Typography variant="h6">Editar Viagem</Typography>
                <IconButton onClick={() => setEditDrawerOpen(false)} sx={{ color: '#999' }}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <Stack spacing={3}>
                {/* --- INÍCIO DA MUDANÇA (Validação) --- */}
                {formError && <Alert severity="error">{formError}</Alert>}

                <TextField
                    label="Nome da Viagem" name="titulo" value={viagemParaEditar.titulo} onChange={handleEditChange}
                    required // 5. Adicionado
                    error={!!(formError && !viagemParaEditar.titulo)} // 5. Adicionado
                    fullWidth InputLabelProps={{ sx: { color: '#999' } }} InputProps={{ sx: { color: 'white' } }}
                    sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#555' } }}
                />
                <TextField
                    label="Data de Início" name="data_inicio" value={viagemParaEditar.data_inicio} onChange={handleEditChange}
                    required // 5. Adicionado
                    error={!!(formError && !viagemParaEditar.data_inicio)} // 5. Adicionado
                    type="date" fullWidth InputLabelProps={{ shrink: true, sx: { color: '#999' } }} InputProps={{ sx: { color: 'white' } }}
                    sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: '#555' } }}
                />
                <TextField
                    label="Data de Fim" name="data_fim" value={viagemParaEditar.data_fim} onChange={handleEditChange}
                    required // 5. Adicionado
                    error={!!(formError && !viagemParaEditar.data_fim)} // 5. Adicionado
                    type="date" fullWidth InputLabelProps={{ shrink: true, sx: { color: '#999' } }} InputProps={{ sx: { color: 'white' } }}
                    sx={{ '& .MiiOutlinedInput-root fieldset': { borderColor: '#555' } }}
                />
                <Box>
                    <FormLabel component="legend" sx={{ color: 'white', marginBottom: 1 }} error={!!(formError && viagemParaEditar.participantes.length === 0)}> {/* 5. Adicionado */}
                        Participantes *
                    </FormLabel>
                    <FormGroup sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {usuarios.map(user => (
                        <FormControlLabel
                        key={user.id}
                        control={
                            <Checkbox
                            sx={{ color: '#555', '&.Mui-checked': { color: '#ff5722' } }}
                            checked={viagemParaEditar.participantes.includes(user.id)}
                            onChange={() => handleEditParticipanteChange(user.id)}
                            />
                        }
                        // --- INÍCIO DA MUDANÇA (Nome) ---
                        label={`${user.first_name} ${user.last_name}`} // 6. Nome completo
                        // --- FIM DA MUDANÇA ---
                        sx={{ color: '#ccc' }}
                        />
                    ))}
                    </FormGroup>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, marginTop: 4 }}>
                    <Button variant="contained" fullWidth sx={{ backgroundColor: '#ff5722', '&:hover': { backgroundColor: '#e64a19' } }} onClick={handleEditSubmit}>
                        Salvar Alterações
                    </Button>
                    <Button variant="outlined" fullWidth sx={{ color: '#999', borderColor: '#555', '&:hover': { borderColor: '#777' } }} onClick={() => setEditDrawerOpen(false)}>
                        Cancelar
                    </Button>
                </Box>
            </Stack>
        </Drawer>
      )}
    </Container>
  );
}

export default Viagens;