import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Stack,
  TableFooter,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Função helper para formatar o cargo
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

// --- INÍCIO DA MUDANÇA (Formatar Data) ---
const formatarData = (dataString) => {
    if (!dataString) return ''; // Proteção contra datas nulas
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
};
// --- FIM DA MUDANÇA ---

function ViagemDetalhes() {
  const { id } = useParams();
  const [viagem, setViagem] = useState(null);
  const [despesas, setDespesas] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true); 
    try {
        const [userRes, viagemRes, despesasRes] = await Promise.all([
            api.get('users/me/'),
            api.get(`viagens/${id}/`),
            api.get(`despesas/?viagem=${id}`) 
        ]);

        setUsuario(userRes.data);
        setViagem(viagemRes.data);
        setDespesas(despesasRes.data); 

    } catch (error) {
        console.error("Erro ao carregar detalhes da viagem:", error);
    } finally {
        setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData(); 
  }, [fetchData]);
  
  const { despesasPendentes, despesasHistorico, totalHistorico } = useMemo(() => {
    const pendentes = [];
    const historico = [];
    let total = 0;

    despesas.forEach(d => {
        if (d.status === 'PENDENTE') {
            pendentes.push(d);
        } else {
            historico.push(d);
            if (d.status === 'APROVADO') {
                total += parseFloat(d.valor);
            }
        }
    });
    return { despesasPendentes: pendentes, despesasHistorico: historico, totalHistorico: total };
  }, [despesas]);


  const podeAprovarOuRejeitar = (despesa) => {
    if (!usuario || !despesa || !despesa.usuario_detalhes) return false;
    if (usuario.id === despesa.usuario_detalhes.id) return false;

    const userRole = usuario.perfil?.tipo;
    const authorRole = despesa.usuario_detalhes.perfil?.tipo;

    if (usuario.is_superuser) return true;
    if (userRole === 'DIRETOR' && authorRole === 'GESTOR') return true;
    if (userRole === 'GESTOR' && authorRole === 'COLABORADOR') return true;

    return false;
  };

  const handleAprovar = async (despesaId) => {
    try {
      await api.post(`despesas/${despesaId}/aprovar/`);
      fetchData(); 
    } catch (error) {
      console.error("Erro ao aprovar despesa:", error.response?.data);
      alert("Erro ao aprovar despesa. Tente novamente.");
    }
  };

  const handleRejeitar = async (despesaId) => {
    const motivo = window.prompt("Por favor, insira o motivo da rejeição:");
    if (!motivo) {
      alert("A observação é obrigatória para rejeitar.");
      return;
    }
    try {
      await api.post(`despesas/${despesaId}/rejeitar/`, { 
        observacao_rejeicao: motivo 
      });
      fetchData(); 
    } catch (error) {
      console.error("Erro ao rejeitar despesa:", error.response?.data);
      alert("Erro ao rejeitar despesa. Tente novamente.");
    }
  };


  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!viagem) {
    return (
      <Container sx={{ color: 'white', marginTop: 4 }}>
        <Typography variant="h6">Viagem não encontrada.</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ marginTop: 4, pb: 8 }}>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
        <IconButton
            component={RouterLink}
            to="/admin/viagens"
            sx={{ 
                color: '#999', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } 
            }}
        >
            <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 0 }}>
            {viagem.titulo}
        </Typography>
      </Box>

      {/* --- INÍCIO DA MUDANÇA (Formatar Data) --- */}
      <Typography variant="subtitle1" sx={{ color: '#aaa', mb: 4, ml: '52px' }}>
        {formatarData(viagem.data_inicio)} até {formatarData(viagem.data_fim)}
      </Typography>
      {/* --- FIM DA MUDANÇA --- */}

      {/* --- Tabela de Pendentes --- */}
      <Paper sx={{ backgroundColor: '#1e1e1e', padding: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffc107' }}>
          Despesas Pendentes
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#999' }}>Descrição</TableCell>
              <TableCell sx={{ color: '#999' }}>Valor</TableCell>
              <TableCell sx={{ color: '#999' }}>Autor</TableCell>
              <TableCell sx={{ color: '#999' }}>Cargo</TableCell>
              <TableCell sx={{ color: '#999' }}>Departamento</TableCell>
              <TableCell sx={{ color: '#999' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {despesasPendentes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ color: '#aaa', textAlign: 'center' }}>
                  Nenhuma despesa pendente.
                </TableCell>
              </TableRow>
            ) : (
              despesasPendentes.map((despesa) => (
                <TableRow key={despesa.id}>
                  <TableCell sx={{ color: 'white' }}>{despesa.descricao}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{formatarValor(despesa.valor)}</TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    {despesa.usuario_detalhes?.first_name} {despesa.usuario_detalhes?.last_name}
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    {formatarCargo(despesa.usuario_detalhes?.perfil?.tipo)}
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    {despesa.usuario_detalhes?.perfil?.departamentos.map(d => d.nome).join(', ') || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {podeAprovarOuRejeitar(despesa) ? (
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#43a047' } }}
                          onClick={() => handleAprovar(despesa.id)}
                        >
                          Aprovar
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ backgroundColor: '#f44336', '&:hover': { backgroundColor: '#e53935' } }}
                          onClick={() => handleRejeitar(despesa.id)}
                        >
                          Rejeitar
                        </Button>
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#777' }}>
                        Sem permissão
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* --- Tabela de Histórico --- */}
      <Paper sx={{ backgroundColor: '#1e1e1e', padding: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
          Histórico de Despesas
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#999' }}>Status</TableCell>
              <TableCell sx={{ color: '#999' }}>Descrição</TableCell>
              <TableCell sx={{ color: '#999' }}>Autor</TableCell>
              <TableCell sx={{ color: '#999' }}>Cargo</TableCell>
              <TableCell sx={{ color: '#999' }} align="right">Valor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {despesasPendentes.length === 0 && despesasHistorico.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} sx={{ color: '#aaa', textAlign: 'center' }}>
                        Nenhuma despesa encontrada nesta viagem.
                    </TableCell>
                </TableRow>
            ) : despesasHistorico.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={5} sx={{ color: '#aaa', textAlign: 'center' }}>
                        Nenhuma despesa processada ainda.
                    </TableCell>
                </TableRow>
            ) : (
              despesasHistorico.map((despesa) => (
                <TableRow key={despesa.id}>
                  <TableCell sx={{ 
                      color: despesa.status === 'APROVADO' ? '#4caf50' 
                           : '#f44336'
                    }}>
                    {despesa.status}
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>{despesa.descricao}</TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    {despesa.usuario_detalhes?.first_name} {despesa.usuario_detalhes?.last_name}
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    {formatarCargo(despesa.usuario_detalhes?.perfil?.tipo)}
                  </TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">
                    {formatarValor(despesa.valor)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
                <TableCell colSpan={4} sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem', border: 0 }} align="right">
                    Total Aprovado (Geral):
                </TableCell>
                <TableCell sx={{ color: '#4caf50', fontWeight: 'bold', fontSize: '1rem', border: 0 }} align="right">
                    {formatarValor(totalHistorico)}
                </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Paper>

    </Container>
  );
}

export default ViagemDetalhes;