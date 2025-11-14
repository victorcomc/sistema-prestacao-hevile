import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark', // Ativa o modo escuro padrão do MUI
    primary: {
      main: '#ff671f', // Laranja HEVILE como cor principal (botões, destaques)
      contrastText: '#ffffff', // Texto branco sobre laranja para contraste
    },
    secondary: {
      main: '#4f758b', // Azul HEVILE para elementos secundários
    },
    background: {
      default: '#121212', // Fundo bem escuro (padrão Dark Mode)
      paper: '#1e1e1e',   // Cards um pouco mais claros que o fundo
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
    error: {
      main: '#d32f2f', // Vermelho padrão para erros
    },
    success: {
      main: '#2e7d32', // Verde padrão para sucessos
    },
  },
  typography: {
    fontFamily: '"Work Sans", "Roboto", "Helvetica", "Arial", sans-serif', // Fonte oficial
    h4: {
      fontWeight: 600,
      letterSpacing: '0.05rem', // Um pouco de espaçamento para dar um ar moderno
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600, // Botões com texto mais forte
    }
  },
  shape: {
    borderRadius: 8, // Bordas um pouco mais arredondadas nos cards e botões
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Sem caixa alta forçada
          fontSize: '1rem',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#e65100', // Laranja um pouco mais escuro no hover
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e', // Navbar da cor dos cards (dark grey)
          backgroundImage: 'none', // Remove gradiente padrão do modo escuro MUI
          borderBottom: '1px solid #333', // Linha sutil de separação
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1e1e1e', // Drawer lateral combinando com Navbar
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: '#2c2c2c', // Cabeçalho da tabela levemente destacado
          color: '#ff671f', // Texto laranja no cabeçalho da tabela
        },
        body: {
             borderBottom: '1px solid #333', // Linhas sutis entre itens
        }
      },
    },
  },
});

export default theme;