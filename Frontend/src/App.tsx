import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Components/Navbar';
import Acceuil from './Pages/Acceuil';
import AxesdeRecherche from './Pages/AxesdeRecherche';
import Chercheurs from './Pages/Chercheurs';
import Publications from './Pages/Publications';
import Actualites from './Pages/Actualites';
import Collaboration from './Pages/Collaboration';
import AdminDashboard from './Pages/AdminDashboard';
import SignIn from './Pages/SignIn';
import SignUp from './Pages/SignUp';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import VerifyEmail from './Pages/VerifyEmail';
import Profile from './Pages/Profile';
import { useEffect, useState } from 'react';
import axios from 'axios';

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname === '/AdminDashboard';
  const isAdminUser = Number(user?.role) === 0;

  useEffect(() => {
    localStorage.removeItem('token');
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/users/me');
        setUser(res.data);
      } catch {
        localStorage.removeItem('session-active');
        setUser(null);
        if (isAdminRoute) {
          navigate('/SignIn', { replace: true });
        }
      }
    };
    fetchUser();
  }, [isAdminRoute, navigate]);

  useEffect(() => {
    if (isAdminRoute && user && !isAdminUser) {
      navigate('/Acceuil', { replace: true });
    }
  }, [isAdminRoute, isAdminUser, navigate, user]);

  const renderRouteContent = () => {
    switch (location.pathname) {
      case '/Acceuil':
        return <Acceuil />;
      case '/AxesdeRecherche':
        return <AxesdeRecherche />;
      case '/Chercheurs':
        return <Chercheurs />;
      case '/Publications':
        return <Publications />;
      case '/Actualites':
        return <Actualites />;
      case '/Collaboration':
        return <Collaboration />;
      case '/AdminDashboard':
        return <AdminDashboard />;
      case '/SignIn':
        return <SignIn setUser={setUser} />;
      case '/SignUp':
        return <SignUp setUser={setUser} />;
      case '/Profile':
        return <Profile user={user} setUser={setUser} />;
      default:
        return <Navigate to="/Acceuil" replace />;
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface-dim text-on-surface">
      {!isAdminRoute && <Navbar user={user} setUser={setUser} />}
      <main className={`relative z-0 ${isAdminRoute ? '' : 'pt-20 sm:pt-24'}`}>
        <div key={location.pathname} className="min-h-[calc(100vh-6rem)] overflow-visible">
          <Routes>
            <Route path="/" element={<Navigate to="/Acceuil" replace />} />
            <Route path="/Acceuil" element={renderRouteContent()} />
            <Route path="/AxesdeRecherche" element={renderRouteContent()} />
            <Route path="/Chercheurs" element={renderRouteContent()} />
            <Route path="/Publications" element={renderRouteContent()} />
            <Route path="/Actualites" element={renderRouteContent()} />
            <Route path="/Collaboration" element={renderRouteContent()} />
            <Route path="/AdminDashboard" element={renderRouteContent()} />
            <Route path="/SignIn" element={renderRouteContent()} />
            <Route path="/SignUp" element={renderRouteContent()} />
            <Route path="/ForgotPassword" element={<ForgotPassword />} />
            <Route path="/ResetPassword" element={<ResetPassword />} />
            <Route path="/VerifyEmail" element={<VerifyEmail setUser={setUser} />} />
            <Route path="/Profile" element={renderRouteContent()} />
            <Route path="*" element={<Navigate to="/Acceuil" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;