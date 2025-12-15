import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';

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

    let Component;
    switch (currentPath) {
        case '/register':
            Component = Register;
            break;
        case '/login':
            Component = Login;
            break;
        default:
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
                </div>
            </nav>
            <Component navigate={navigate} />
        </div>
    );
}

export default App;
