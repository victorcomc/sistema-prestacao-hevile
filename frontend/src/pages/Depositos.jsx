import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Typography, Container, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Box, Button, Drawer, 
    IconButton, Stack, TextField, InputAdornment, Alert, Tooltip,
    FormControl, InputLabel, Select, MenuItem, Divider 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Helper para formatar o cargo
const formatarCargo = (tipo) => {
    if (!tipo) return 'N/A';
    const cargos = {
      'DIRETOR': 'Diretor',
      'GESTOR': 'Gestor',
      'COLABORADOR': 'Colaborador'
    };
    return cargos[tipo] || tipo;
};

// Helper para formatar moeda
const formatarValor = (valor) => {
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Helper para formatar data (AAAA-MM-DD -> DD/MM/AAAA)
const formatarData = (dataString) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
};

// Helper para formatar e colorir o saldo
const SaldoCell = ({ valor }) => {
    const valorNum = parseFloat(valor);
    const cor = valorNum >= 0 ? 'success.main' : 'error.main';
    const texto = formatarValor(valorNum);
    
    return (
        <Typography variant="body2" sx={{ color: cor, fontWeight: 'bold' }}>
            {texto}
        </Typography>
    );
};


function Depositos() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // --- INÍCIO DA MUDANÇA ---
    const [todasViagens, setTodasViagens] = useState([]); // Renomeado
    const [viagemSelecionada, setViagemSelecionada] = useState(''); 
    const [participantes, setParticipantes] = useState([]);
    const [historicoDepositos, setHistoricoDepositos] = useState([]);
    // --- FIM DA MUDANÇA ---

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [valorDeposito, setValorDeposito] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [comprovante, setComprovante] = useState(null);

    // Carrega as viagens e o histórico no início
    useEffect(() => {
        loadTodasViagens(); // Renomeado
        loadHistoricoDepositos();
    }, []);

    // --- INÍCIO DA MUDANÇA ---
    const loadTodasViagens = () => {
        // Remove o filtro "?status=preparando" para buscar todas as viagens
        api.get('viagens/') 
            .then(res => {
                setTodasViagens(res.data); // Renomeado
            })
            .catch(err => {
                console.error("Erro ao buscar viagens:", err);
                setError("Não foi possível carregar as viagens.");
            })
            .finally(() => setLoading(false));
    };
    // --- FIM DA MUDANÇA ---

    const loadHistoricoDepositos = () => {
        api.get('adiantamentos/')
            .then(res => {
                setHistoricoDepositos(res.data);
            })
            .catch(err => {
                console.error("Erro ao buscar histórico de depósitos:", err);
                setError("Não foi possível carregar o histórico.");
            });
    };

    const handleViagemChange = (e) => {
        const viagemId = e.target.value;
        setViagemSelecionada(viagemId);

        if (!viagemId) {
            setParticipantes([]);
            return;
        }

        setLoading(true);
        // --- INÍCIO DA MUDANÇA ---
        // Busca na lista 'todasViagens'
        const viagem = todasViagens.find(v => v.id === viagemId);
        // --- FIM DA MUDANÇA ---
        if (viagem) {
            setParticipantes(viagem.participantes_detalhes);
        }
        setLoading(false);
    };
    
    const recarregarSaldosParticipantes = () => {
        if (!viagemSelecionada) return;

        api.get(`viagens/${viagemSelecionada}/`)
            .then(res => {
                setParticipantes(res.data.participantes_detalhes);
            })
            .catch(err => console.error("Erro ao recarregar participantes:", err));
    };

    const handleOpenDrawer = (user) => {
        setCurrentUser(user);
        setValorDeposito('');
        setObservacoes('');
        setComprovante(null); 
        setError('');
        setSuccess('');
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setCurrentUser(null);
    };

    const handleSubmitDeposito = () => {
        if (!currentUser || !valorDeposito || parseFloat(valorDeposito) <= 0 || !viagemSelecionada) {
            setError("Viagem, usuário e valor são obrigatórios.");
            return;
        }
        
        const formData = new FormData();
        formData.append('usuario', currentUser.id);
        formData.append('viagem', viagemSelecionada); 
        formData.append('valor', valorDeposito);
        formData.append('observacoes', observacoes || `Depósito para viagem ${viagemSelecionada}`);
        
        if (comprovante) {
            formData.append('comprovante_deposito', comprovante, comprovante.name);
        }

        api.post('adiantamentos/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(() => {
                setSuccess(`Depósito de R$ ${valorDeposito} realizado para ${currentUser.first_name}!`);
                handleCloseDrawer();
                recarregarSaldosParticipantes(); 
                loadHistoricoDepositos(); 
            })
            .catch(err => {
                console.error("Erro ao criar adiantamento:", err.response?.data);
                setError("Falha ao realizar depósito.");
            });
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, pb: 8 }}>
            
            <Paper sx={{ p: 4, mb: 4 }}>
                <Typography variant="h4" color="primary" gutterBottom>
                    Depósitos e Saldos
                </Typography>
                {/* --- INÍCIO DA MUDANÇA --- */}
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Selecione uma viagem para adicionar depósitos (adiantamentos) aos participantes.
                </Typography>

                <FormControl fullWidth sx={{ mb: 4 }}>
                    <InputLabel id="select-viagem-label">Selecione uma Viagem</InputLabel>
                    <Select
                        labelId="select-viagem-label"
                        value={viagemSelecionada}
                        label="Selecione uma Viagem"
                        onChange={handleViagemChange}
                    >
                {/* --- FIM DA MUDANÇA --- */}
                        <MenuItem value="">
                            <em>Nenhuma</em>
                        </MenuItem>
                        {/* --- INÍCIO DA MUDANÇA --- */}
                        {todasViagens.map((viagem) => (
                            <MenuItem key={viagem.id} value={viagem.id}>
                                {viagem.titulo} ({formatarData(viagem.data_inicio)})
                            </MenuItem>
                        ))}
                        {/* --- FIM DA MUDANÇA --- */}
                    </Select>
                </FormControl>

                <Stack spacing={2} sx={{ mb: 2 }}>
                    {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
                    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
                </Stack>

                {viagemSelecionada && (
                    <TableContainer>
                        <Typography variant="h6" color="white" sx={{mb: 2}}>Participantes da Viagem</Typography>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nome</TableCell>
                                    <TableCell>Perfil</TableCell>
                                    <TableCell>Email / Login</TableCell>
                                    <TableCell>Saldo Atual</TableCell>
                                    <TableCell align="right">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">Carregando...</TableCell>
                                    </TableRow>
                                ) : participantes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{color: '#999'}}>
                                            Esta viagem não possui participantes.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    participantes.map(user => (
                                        <TableRow key={user.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {user.first_name} {user.last_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{formatarCargo(user.perfil?.tipo)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2">{user.email}</Typography>
                                                    <Typography variant="caption" color="text.secondary">Login: {user.username}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <SaldoCell valor={user.saldo} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Adicionar Saldo">
                                                    <IconButton 
                                                        color="primary" 
                                                        size="small" 
                                                        onClick={() => handleOpenDrawer(user)}
                                                    >
                                                        <AddCircleOutlineIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* --- Tabela de Histórico de Depósitos --- */}
            <Paper sx={{ p: 4, backgroundColor: '#1e1e1e' }}>
                <Typography variant="h5" color="primary" gutterBottom>
                    Histórico de Depósitos
                </Typography>
                <TableContainer>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: '#999' }}>Data</TableCell>
                                <TableCell sx={{ color: '#999' }}>Usuário</TableCell>
                                <TableCell sx={{ color: '#999' }}>Viagem</TableCell>
                                <TableCell sx={{ color: '#999' }}>Observações</TableCell>
                                <TableCell sx={{ color: '#999' }} align="right">Valor</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {historicoDepositos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ color: '#aaa', py: 5 }}>
                                        Nenhum depósito realizado ainda.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                historicoDepositos.map(deposito => (
                                    <TableRow key={deposito.id} hover>
                                        <TableCell sx={{ color: 'white' }}>
                                            {formatarData(deposito.data_adiantamento)}
                                        </TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 500 }}>
                                            {deposito.usuario_detalhes?.first_name} {deposito.usuario_detalhes?.last_name}
                                        </TableCell>
                                        <TableCell sx={{ color: '#ccc' }}>
                                            {deposito.viagem_titulo || 'N/A'}
                                        </TableCell>
                                        <TableCell sx={{ color: '#ccc' }}>
                                            {deposito.observacoes}
                                        </TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                                            {formatarValor(deposito.valor)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>


            {/* --- Drawer de Depósito --- */}
            <Drawer anchor="right" open={drawerOpen} onClose={handleCloseDrawer} PaperProps={{ sx: { width: '400px', p: 3 } }}>
                {currentUser && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6">Novo Depósito</Typography>
                            <IconButton onClick={handleCloseDrawer}><CloseIcon /></IconButton>
                        </Box>
                        
                        <Stack spacing={3}>
                            <Typography>
                                Adicionando saldo para: <br/>
                                <strong style={{ color: '#ff5722' }}>{currentUser.first_name} {currentUser.last_name}</strong>
                            </Typography>
                            
                            <TextField
                                required
                                name="valor"
                                label="Valor do Depósito"
                                type="number"
                                fullWidth
                                InputProps={{ 
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                                value={valorDeposito}
                                onChange={(e) => setValorDeposito(e.target.value)}
                            />
                            <TextField
                                name="observacoes"
                                label="Observações (Ex: Adiantamento)"
                                fullWidth
                                multiline
                                rows={3}
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                            />
                            <Button 
                                component="label" 
                                variant="outlined" 
                                startIcon={<CloudUploadIcon />}
                                fullWidth
                            >
                                {comprovante ? comprovante.name.substring(0, 20)+"..." : 'Anexar Comprovante'}
                                <input 
                                    type="file" 
                                    hidden 
                                    onChange={(e) => setComprovante(e.target.files[0])} 
                                />
                            </Button>

                            {error && <Alert severity="error">{error}</Alert>}

                            <Button 
                                type="button" 
                                variant="contained" 
                                color="primary" 
                                size="large" 
                                fullWidth
                                onClick={handleSubmitDeposito}
                            >
                                Confirmar Depósito
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Drawer>

        </Container>
    );
}

export default Depositos;