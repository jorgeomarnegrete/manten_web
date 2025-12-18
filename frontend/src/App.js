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
import GeneralSettings from './pages/settings/GeneralSettings';
import Header from './components/Header';
import { AuthProvider, useAuth } from './context/AuthContext';

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
        case '/settings/general':
            Component = GeneralSettings;
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
            <Header navigate={navigate} />
            <Component navigate={navigate} />
        </div>
    );
}

import { CompanyProvider } from './context/CompanyContext';

function App() {
    return (
        <AuthProvider>
            <CompanyProvider>
                <AppContent />
            </CompanyProvider>
        </AuthProvider>
    );
}

export default App;
