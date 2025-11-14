import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminArea from './pages/AdminArea';
import Viagens from './pages/Viagens';
import ViagemDetalhes from './pages/ViagemDetalhes';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import Depositos from './pages/Depositos'; // <<< 1. IMPORTAR NOVO COMPONENTE

// Componente para proteger rotas privadas
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

// Componente para redirecionar o usuário para o local correto
const RootRedirect = () => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
        return <Navigate to="/admin/viagens" replace />;
    } else {
        return <Navigate to="/despesas" replace />;
    }
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rota pública de Login (sem Navbar) */}
                <Route path="/login" element={<Login />} />

                {/* Rotas protegidas (com Navbar) */}
                <Route path="/*" element={
                    <PrivateRoute>
                        <Navbar /> {/* Navbar só aparece se estiver logado */}
                        <Routes>
                            
                            {/* Rota principal do Colaborador */}
                            <Route path="/despesas" element={<Perfil />} />
                            
                            {/* Rotas do Admin */}
                            <Route path="/admin" element={<AdminArea />} />
                            <Route path="/admin/viagens" element={<Viagens />} />
                            <Route path="/admin/viagens/:id" element={<ViagemDetalhes />} />
                            
                            {/* --- INÍCIO DA MUDANÇA --- */}
                            <Route path="/admin/depositos" element={<Depositos />} /> 
                            {/* --- FIM DA MUDANÇA --- */}

                            {/* Redirecionamento padrão (/) usa o RootRedirect */}
                            <Route path="/" element={<RootRedirect />} />
                            
                        </Routes>
                    </PrivateRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}

export default App;