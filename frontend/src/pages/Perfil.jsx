import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Container, Typography, Paper, Box, Avatar, Grid, Chip, Tabs, Tab,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Drawer, Stack, TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment, Button, Alert, Tooltip,
    Modal 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AttachmentIcon from '@mui/icons-material/Attachment';

// Componente de Status da Viagem (com Emojis)
const ViagemStatus = ({ viagem }) => {
    const theme = useTheme();
    if (!viagem) {
        return <Alert severity="info" sx={{backgroundColor: '#222', color: '#999', border: '1px solid #444'}}>Você não possui viagens ativas ou pendentes no momento.</Alert>;
    }

    const statusMap = {
        "ATIVA": { 
            label: "EM VIAGEM", 
            color: theme.palette.success.main, 
            icon: <FlightTakeoffIcon sx={{ color: '#fff', fontSize: '1.2rem' }} /> 
        },
        "AGUARDANDO": { 
            label: "AGUARDANDO VIAGEM", 
            color: theme.palette.warning.main, 
            icon: <AccessTimeIcon sx={{ color: '#fff', fontSize: '1.2rem' }} /> 
        },
        "FINALIZADA": { 
            label: "VIAGEM FINALIZADA", 
            color: theme.palette.error.main, 
            icon: <CheckCircleIcon sx={{ color: '#fff', fontSize: '1.2rem' }} /> 
        },
    };

    const info = statusMap[viagem.status] || statusMap["FINALIZADA"];

    return (
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, backgroundColor: info.color, color: '#fff' }}>
            {info.icon}
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{info.label}</Typography>
                <Typography variant="body2">{viagem.titulo}</Typography>
            </Box>
        </Paper>
    );
};

// Função helper para formatar o cargo
const formatarCargo = (tipo) => {
    if (!tipo) return 'Cargo não definido';
    const cargos = {
        'DIRETOR': 'Diretor',
        'GESTOR': 'Gestor',
        'COLABORADOR': 'Colaborador'
    };
    return cargos[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
};


function Perfil() {
    const theme = useTheme();
    const statusColors = {
        'PENDENTE': theme.palette.warning.main,
        'APROVADO': theme.palette.success.main,
        'REJEITADO': theme.palette.error.main,
    };

    const [userData, setUserData] = useState(null);
    const [minhasDespesas, setMinhasDespesas] = useState([]);
    const [tabValue, setTabValue] = useState(0); 
    const [viagemAtual, setViagemAtual] = useState(null); 

    const [imagemEmVisualizacao, setImagemEmVisualizacao] = useState(null);
    const handleAbrirImagem = (url) => setImagemEmVisualizacao(url);
    const handleFecharImagem = () => setImagemEmVisualizacao(null);

    const [drawerEditOpen, setDrawerEditOpen] = useState(false);
    const [despesaEmEdicao, setDespesaEmEdicao] = useState(null);

    const [drawerDespesaOpen, setDrawerDespesaOpen] = useState(false);
    const [novaDespesa, setNovaDespesa] = useState({
        descricao: '', valor: '', data_despesa: new Date().toISOString().split('T')[0], categoria: 'OUTROS', comprovante: null
    });

    // --- INÍCIO DA MUDANÇA (Validação) ---
    const [formError, setFormError] = useState('');
    // --- FIM DA MUDANÇA ---

    useEffect(() => {
        carregarTudo();
    }, []);

    const carregarTudo = () => {
        api.get('users/me/')
            .then(res => {
                setUserData(res.data);
                setViagemAtual(res.data.viagem_atual); 
            })
            .catch(err => console.error("Erro ao carregar perfil:", err));
            
        const userTipo = localStorage.getItem('userTipo');
        if (userTipo !== 'DIRETOR') {
            api.get('despesas/')
                .then(res => setMinhasDespesas(res.data))
                .catch(err => console.error("Erro ao carregar despesas:", err));
        }
    };

    const handleEditClick = (despesa) => {
        setDespesaEmEdicao({
            ...despesa,
            data_despesa: despesa.data_despesa.split('T')[0] 
        });
        setDrawerEditOpen(true);
    };

    const handleUpdateDespesa = () => {
        // (Lógica de update não precisa de validação de 'required')
        const formData = new FormData();
        formData.append('descricao', despesaEmEdicao.descricao);
        formData.append('valor', despesaEmEdicao.valor);
        formData.append('data_despesa', despesaEmEdicao.data_despesa);
        formData.append('categoria', despesaEmEdicao.categoria);
        if (despesaEmEdicao.novoComprovante) {
            formData.append('comprovante', despesaEmEdicao.novoComprovante);
        }

        api.patch(`despesas/${despesaEmEdicao.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' }})
            .then(() => {
                alert("Despesa atualizada! Status voltou para PENDENTE.");
                setDrawerEditOpen(false);
                carregarTudo(); 
            })
            .catch(error => alert("Erro ao atualizar despesa."));
    };

    const handleFileChange = (e) => {
        setNovaDespesa({ ...novaDespesa, comprovante: e.target.files[0] });
    };

    // --- INÍCIO DA MUDANÇA (Validação) ---
    const handleSubmitDespesa = () => {
        setFormError(''); // Limpa erros antigos

        // 1. Validar viagem ativa
        if (!viagemAtual || !viagemAtual.id) {
            setFormError("Erro: Nenhuma viagem ativa selecionada para lançar a despesa.");
            return;
        }

        // 2. Validar campos obrigatórios
        const { descricao, valor, data_despesa, categoria, comprovante } = novaDespesa;
        if (!descricao || !valor || !data_despesa || !categoria || !comprovante) {
            setFormError("Erro: Todos os campos, incluindo o comprovante, são obrigatórios.");
            return;
        }
        // --- FIM DA MUDANÇA ---

        const formData = new FormData();
        formData.append('viagem', viagemAtual.id); 
        formData.append('descricao', novaDespesa.descricao);
        formData.append('valor', novaDespesa.valor);
        formData.append('data_despesa', novaDespesa.data_despesa);
        formData.append('categoria', novaDespesa.categoria);
        if (novaDespesa.comprovante) {
            formData.append('comprovante', novaDespesa.comprovante);
        }

        api.post('despesas/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(() => {
                alert("Despesa lançada com sucesso!");
                setDrawerDespesaOpen(false);
                carregarTudo(); 
                setNovaDespesa({ descricao: '', valor: '', data_despesa: new Date().toISOString().split('T')[0], categoria: 'OUTROS', comprovante: null });
                setFormError(''); // Limpa o erro
            })
            .catch(err => {
                console.error("Erro ao lançar despesa:", err);
                // Erro vindo do backend (ex: se a validação do models falhar)
                if (err.response?.data?.comprovante) {
                     setFormError("Erro do servidor: O comprovante é obrigatório.");
                } else {
                     setFormError("Erro ao lançar despesa.");
                }
            });
    };


    if (!userData) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
                <Typography sx={{ color: 'white' }}>Carregando perfil...</Typography>
            </Container>
        );
    }

    const isDiretor = userData?.perfil?.tipo === 'DIRETOR';

    return (
        <Container maxWidth="md" sx={{ mt: 4, pb: 8 }}>
            {/* CARTÃO DE PERFIL */}
            <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 3, background: 'linear-gradient(45deg, #1e1e1e 30%, #252525 90%)' }}>
                
                <Avatar 
                    src={userData.perfil?.foto_perfil} 
                    variant="rounded" 
                    sx={{ 
                        width: 100, 
                        height: 100, 
                        bgcolor: theme.palette.primary.main, 
                        fontSize: '2.5rem', 
                        objectFit: 'cover'
                    }}
                >
                    {userData.first_name?.[0]}{userData.last_name?.[0]}
                </Avatar>
                
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" color="primary"> 
                        {userData.first_name} {userData.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {formatarCargo(userData.perfil?.tipo)}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">Saldo Atual</Typography>
                    <Typography variant="h4" sx={{ color: userData.saldo >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                        {parseFloat(userData.saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Typography>
                </Box>
            </Paper>

            {!isDiretor && (
                <>
                    {/* STATUS DA VIAGEM */}
                    <Box sx={{ mb: 3 }}>
                        <ViagemStatus viagem={viagemAtual} />
                    </Box>

                    {/* BOTÃO ADICIONAR DESPESA */}
                    <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        sx={{ mb: 3, py: 1.5, fontSize: '1.1rem' }}
                        onClick={() => { setDrawerDespesaOpen(true); setFormError(''); }} // Limpa o erro ao abrir
                        disabled={viagemAtual?.status !== 'ATIVA'} 
                    >
                        + Adicionar Nova Despesa
                    </Button>
                    
                    {/* ABAS */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} textColor="primary" indicatorColor="primary">
                            <Tab label="Histórico de Despesas" />
                            <Tab label="Gerenciar (Editar)" />
                        </Tabs>
                    </Box>

                    {/* TAB 0: HISTÓRICO DE DESPESAS (Apenas leitura) */}
                    {tabValue === 0 && (
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" color="primary" gutterBottom>Histórico de Despesas</Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Data</TableCell>
                                            <TableCell>Descrição</TableCell>
                                            <TableCell align="right">Valor</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {minhasDespesas.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Box sx={{ 
                                                        width: 12, height: 12, borderRadius: '50%', 
                                                        bgcolor: item.status === 'PENDENTE' ? theme.palette.warning.main : item.status === 'APROVADO' ? theme.palette.success.main : theme.palette.error.main 
                                                    }} />
                                                </TableCell>
                                                <TableCell>{new Date(item.data_despesa).toLocaleDateString('pt-BR',{timeZone: 'UTC'})}</TableCell>
                                                
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {item.comprovante && (
                                                            <Tooltip title="Ver Comprovante">
                                                                <IconButton 
                                                                    onClick={() => handleAbrirImagem(item.comprovante)} 
                                                                    size="small"
                                                                    color="primary"
                                                                >
                                                                    <AttachmentIcon fontSize="inherit" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {item.descricao}
                                                    </Box>
                                                </TableCell>

                                                <TableCell align="right" sx={{ color: theme.palette.text.secondary }}>
                                                    {parseFloat(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* TAB 1: GERENCIAR (Permite edição) */}
                    {tabValue === 1 && (
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" color="primary" gutterBottom>Gerenciar Despesas</Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Data</TableCell>
                                            <TableCell>Descrição</TableCell>
                                            <TableCell>Status Atual</TableCell>
                                            <TableCell align="right">Ação</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {minhasDespesas.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{new Date(item.data_despesa).toLocaleDateString('pt-BR',{timeZone: 'UTC'})}</TableCell>

                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {item.comprovante && (
                                                            <Tooltip title="Ver Comprovante">
                                                                <IconButton 
                                                                    onClick={() => handleAbrirImagem(item.comprovante)} 
                                                                    size="small"
                                                                    color="primary"
                                                                >
                                                                    <AttachmentIcon fontSize="inherit" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {item.descricao}
                                                    </Box>
                                                </TableCell>
                                                
                                                <TableCell>
                                                    <Typography 
                                                        variant="body2"
                                                        sx={{
                                                            color: statusColors[item.status] || theme.palette.text.secondary,
                                                            fontWeight: 'bold',
                                                            fontSize: '0.875rem'
                                                        }}
                                                    >
                                                        {item.status}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="right">
                                                    <IconButton onClick={() => handleEditClick(item)} size="small" color="primary">
                                                        <EditIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}
                </>
            )}

            {/* --- DRAWER DE NOVA DESPESA --- */}
            <Drawer anchor="right" open={drawerDespesaOpen} onClose={() => setDrawerDespesaOpen(false)} PaperProps={{ sx: { width: '400px', p: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}><Typography variant="h6">Nova Despesa</Typography><IconButton onClick={() => setDrawerDespesaOpen(false)}><CloseIcon /></IconButton></Box>
                <Stack spacing={3}>
                    {/* --- INÍCIO DA MUDANÇA (Validação) --- */}
                    {formError && <Alert severity="error">{formError}</Alert>}

                    <TextField 
                        label="Descrição" 
                        fullWidth 
                        required 
                        value={novaDespesa.descricao} 
                        onChange={(e) => setNovaDespesa({ ...novaDespesa, descricao: e.target.value })} 
                        error={formError && !novaDespesa.descricao}
                    />
                    <TextField 
                        label="Valor" 
                        type="number" 
                        fullWidth 
                        required
                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }} 
                        value={novaDespesa.valor} 
                        onChange={(e) => setNovaDespesa({ ...novaDespesa, valor: e.target.value })} 
                        error={formError && !novaDespesa.valor}
                    />
                    <FormControl fullWidth required error={formError && !novaDespesa.categoria}>
                        <InputLabel>Categoria</InputLabel>
                        <Select 
                            value={novaDespesa.categoria} 
                            label="Categoria" 
                            onChange={(e) => setNovaDespesa({ ...novaDespesa, categoria: e.target.value })}
                        >
                            <MenuItem value="ALIMENTACAO">Alimentação</MenuItem>
                            <MenuItem value="TRANSPORTE">Transporte</MenuItem>
                            <MenuItem value="HOSPEDAGEM">Hospedagem</MenuItem>
                            <MenuItem value="OUTROS">Outros</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField 
                        label="Data" 
                        type="date" 
                        fullWidth 
                        required
                        InputLabelProps={{ shrink: true }} 
                        value={novaDespesa.data_despesa} 
                        onChange={(e) => setNovaDespesa({ ...novaDespesa, data_despesa: e.target.value })} 
                        error={formError && !novaDespesa.data_despesa}
                    />
                    <Button 
                        component="label" 
                        variant="outlined" 
                        startIcon={<CloudUploadIcon />}
                        color={formError && !novaDespesa.comprovante ? 'error' : 'primary'} // Muda a cor se houver erro
                    >
                        {novaDespesa.comprovante ? novaDespesa.comprovante.name : 'Anexar Comprovante *'}
                        <input type="file" hidden onChange={handleFileChange} />
                    </Button>
                    <Button variant="contained" fullWidth onClick={handleSubmitDespesa}>Lançar Despesa</Button>
                    {/* --- FIM DA MUDANÇA --- */}
                </Stack>
            </Drawer>

            {/* (O resto do arquivo permanece o mesmo) */}
            
            {/* DRAWER DE EDIÇÃO */}
            <Drawer anchor="right" open={drawerEditOpen} onClose={() => setDrawerEditOpen(false)} PaperProps={{ sx: { width: '400px', p: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6">Editar Despesa</Typography>
                    <IconButton onClick={() => setDrawerEditOpen(false)}><CloseIcon /></IconButton>
                </Box>
                {despesaEmEdicao && (
                    <Stack spacing={3}>
                        <TextField label="Descrição" fullWidth value={despesaEmEdicao.descricao} onChange={(e) => setDespesaEmEdicao({ ...despesaEmEdicao, descricao: e.target.value })} />
                        <TextField label="Valor" type="number" fullWidth value={despesaEmEdicao.valor} onChange={(e) => setDespesaEmEdicao({ ...despesaEmEdicao, valor: e.target.value })} />
                        <FormControl fullWidth>
                            <InputLabel>Categoria</InputLabel>
                            <Select value={despesaEmEdicao.categoria} label="Categoria" onChange={(e) => setDespesaEmEdicao({ ...despesaEmEdicao, categoria: e.target.value })}>
                                <MenuItem value="ALIMENTACAO">Alimentação</MenuItem>
                                <MenuItem value="TRANSPORTE">Transporte</MenuItem>
                                <MenuItem value="HOSPEDAGEM">Hospedagem</MenuItem>
                                <MenuItem value="OUTROS">Outros</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField label="Data" type="date" fullWidth InputLabelProps={{ shrink: true }} value={despesaEmEdicao.data_despesa} onChange={(e) => setDespesaEmEdicao({ ...despesaEmEdicao, data_despesa: e.target.value })} />
                        
                        <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                            Alterar Comprovante
                            <input type="file" hidden onChange={(e) => setDespesaEmEdicao({ ...despesaEmEdicao, novoComprovante: e.target.files[0] })} />
                        </Button>
                        
                        <Button variant="contained" fullWidth onClick={handleUpdateDespesa}>Salvar Alterações</Button>
                        <Typography variant="caption" sx={{ color: theme.palette.warning.main, textAlign: 'center' }}>
                            Atenção: Ao salvar, o status voltará para PENDENTE.
                        </Typography>
                    </Stack>
                )}
            </Drawer>

            {/* MODAL DE VISUALIZAÇÃO DE IMAGEM */}
            <Modal
                open={!!imagemEmVisualizacao} 
                onClose={handleFecharImagem}
                aria-labelledby="modal-comprovante"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Paper 
                    sx={{ 
                        maxWidth: '90vw', 
                        maxHeight: '90vh', 
                        overflow: 'auto', 
                        bgcolor: 'background.paper', 
                        p: 1, 
                        outline: 'none',
                    }}
                >
                    {imagemEmVisualizacao && imagemEmVisualizacao.toLowerCase().endsWith('.pdf') ? (
                        <iframe 
                            src={imagemEmVisualizacao} 
                            style={{ width: '80vw', height: '90vh', border: 'none' }}
                            title="Comprovante PDF"
                        />
                    ) : (
                        <img 
                            src={imagemEmVisualizacao} 
                            alt="Comprovante" 
                            style={{ maxWidth: '100%', maxHeight: '90vh', display: 'block' }} 
                        />
                    )}
                </Paper>
            </Modal>
            
        </Container>
    );
}

export default Perfil;