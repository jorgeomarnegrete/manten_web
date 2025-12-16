import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';
import Billing from './pages/Billing';

function App() {
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
        default:
            // Fallback to Login, but let's check if we are in a known sub-route or debug
            // console.log("Unknown path:", currentPath); 
            Component = Login;
            break;
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <nav className="p-4 bg-white shadow-sm flex justify-between items-center px-8">
                <div className="font-bold text-xl text-blue-600">MantenPro</div>
                <div className="space-x-4">
                    <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-blue-600">Ingresar</button>
                    <button onClick={() => navigate('/register')} className="text-gray-600 hover:text-blue-600">Registro</button>
                    <button onClick={() => navigate('/pricing')} className="text-gray-600 hover:text-blue-600">Precios</button>
                </div>
            </nav>
            <Component navigate={navigate} />
        </div>
    );
}

export default App;
