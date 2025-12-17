import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';
import Billing from './pages/Billing';
import Dashboard from './pages/Dashboard';
import Sectors from './pages/archives/Sectors';
import Assets from './pages/archives/Assets';
import Workers from './pages/archives/Workers';
import Tools from './pages/archives/Tools';
import PreventivePlans from './pages/preventive/PreventivePlans';
import PlanEditor from './pages/preventive/PlanEditor';
import WorkOrderList from './pages/work_orders/WorkOrderList';
import { AuthProvider, useAuth } from './context/AuthContext';

const Navigation = ({ navigate }) => {
    const { isAuthenticated, logout } = useAuth();
    const [showArchives, setShowArchives] = useState(false);
    const [showMaintenance, setShowMaintenance] = useState(false);

    return (
        <nav className="p-4 bg-white shadow-sm flex justify-between items-center px-8 relative z-50">
            <div className="font-bold text-xl text-blue-600 cursor-pointer" onClick={() => navigate('/')}>MantenPro</div>
            <div className="space-x-4 flex items-center">
                {isAuthenticated ? (
                    <>
                        {/* Maintenance Dropdown */}
                        <div className="relative inline-block text-left">
                            <button
                                onMouseEnter={() => setShowMaintenance(true)}
                                onClick={() => setShowMaintenance(!showMaintenance)}
                                className="text-gray-600 hover:text-blue-600 font-medium inline-flex items-center"
                            >
                                Mantenimiento
                                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                            {showMaintenance && (
                                <div
                                    onMouseLeave={() => setShowMaintenance(false)}
                                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                >
                                    <div className="py-1">
                                        <button onClick={() => { navigate('/preventive/plans'); setShowMaintenance(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Planes Preventivos</button>
                                        <button onClick={() => { navigate('/work-orders'); setShowMaintenance(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Órdenes de Trabajo</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Archives Dropdown */}
                        <div className="relative inline-block text-left">
                            <button
                                onMouseEnter={() => setShowArchives(true)}
                                onClick={() => setShowArchives(!showArchives)}
                                className="text-gray-600 hover:text-blue-600 font-medium inline-flex items-center"
                            >
                                Archivos
                                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                            {showArchives && (
                                <div
                                    onMouseLeave={() => setShowArchives(false)}
                                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                >
                                    <div className="py-1">
                                        <button onClick={() => { navigate('/archives/sectors'); setShowArchives(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sectores</button>
                                        <button onClick={() => { navigate('/archives/assets'); setShowArchives(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Activos</button>
                                        <button onClick={() => { navigate('/archives/workers'); setShowArchives(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Personal</button>
                                        <button onClick={() => { navigate('/archives/tools'); setShowArchives(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Herramientas</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-blue-600">Dashboard</button>
                        <button onClick={logout} className="text-gray-600 hover:text-red-600">Salir</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-blue-600">Ingresar</button>
                        <button onClick={() => navigate('/register')} className="text-gray-600 hover:text-blue-600">Registro</button>
                        <button onClick={() => navigate('/pricing')} className="text-gray-600 hover:text-blue-600">Precios</button>
                    </>
                )}
            </div>
        </nav>
    );
};

function AppContent() {
    const { isAuthenticated, loading } = useAuth();
    const [currentPath, setCurrentPath] = useState(window.location.pathname);

    useEffect(() => {
        const handlePopState = () => {
            setCurrentPath(window.location.pathname);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = (path) => {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
    };

    // Normalize path to ignore trailing slash
    const normalizedPath = currentPath.endsWith('/') && currentPath.length > 1 ? currentPath.slice(0, -1) : currentPath;

    // Route Protection Logic
    useEffect(() => {
        const publicRoutes = ['/', '/login', '/register', '/pricing'];
        if (!loading && !isAuthenticated && !publicRoutes.includes(normalizedPath)) {
            // If user is not authenticated and tries to access a protected route
            window.history.pushState({}, '', '/login');
            setCurrentPath('/login');
        }
    }, [isAuthenticated, loading, normalizedPath]);

    let Component;
    switch (normalizedPath) {
        case '/register':
            Component = Register;
            break;
        case '/login':
            Component = Login;
            break;
        case '/pricing':
            Component = Pricing;
            break;
        case '/billing':
            Component = Billing;
            break;
        case '/dashboard':
            Component = Dashboard;
            break;
        case '/archives/sectors':
            Component = Sectors;
            break;
        case '/archives/assets':
            Component = Assets;
            break;
        case '/archives/workers':
            Component = Workers;
            break;
        case '/archives/tools':
            Component = Tools;
            break;
        case '/preventive/plans':
            Component = PreventivePlans;
            break;
        case '/preventive/new':
            Component = PlanEditor;
            break;
        case '/work-orders':
            Component = WorkOrderList;
            break;
        default:
            // Fallback to Login, but let's check if we are in a known sub-route or debug
            // console.log("Unknown path:", currentPath); 
            Component = Login;
            break;
            Component = Login;
            break;
    }

    if (loading) return <div className="p-10 text-center">Cargando...</div>;

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Navigation navigate={navigate} />
            <Component navigate={navigate} />
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
