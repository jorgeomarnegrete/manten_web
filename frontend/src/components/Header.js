import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCompanySettings, API_URL } from '../api';

const Header = ({ navigate }) => {
    const { isAuthenticated, logout } = useAuth();
    const [showArchives, setShowArchives] = useState(false);
    const [showMaintenance, setShowMaintenance] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [companyData, setCompanyData] = useState({ name: 'MantenPro', logo_url: null });

    useEffect(() => {
        if (isAuthenticated) {
            loadCompanyData();
        }
    }, [isAuthenticated]);

    const loadCompanyData = async () => {
        try {
            const data = await getCompanySettings();
            setCompanyData({
                name: data.name || 'MantenPro',
                logo_url: data.logo_url
            });
        } catch (error) {
            console.error("Error loading header data:", error);
        }
    };

    const logoSrc = companyData.logo_url
        ? (companyData.logo_url.startsWith('http') ? companyData.logo_url : `${API_URL}${companyData.logo_url}`)
        : null;

    return (
        <nav className="p-4 bg-white shadow-sm flex justify-between items-center px-8 relative z-50">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                {isAuthenticated && logoSrc && (
                    <img
                        src={logoSrc}
                        alt="Logo"
                        className="h-10 w-auto object-contain"
                    />
                )}
                {!isAuthenticated ? (
                    <div className="font-bold text-xl text-blue-600">MantenPro</div>
                ) : (
                    <div className="font-bold text-xl text-gray-800">{companyData.name}</div>
                )}
            </div>

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

                        {/* Settings Dropdown */}
                        <div className="relative inline-block text-left">
                            <button
                                onMouseEnter={() => setShowSettings(true)}
                                onClick={() => setShowSettings(!showSettings)}
                                className="text-gray-600 hover:text-blue-600 font-medium inline-flex items-center"
                            >
                                Configuración
                                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                            {showSettings && (
                                <div
                                    onMouseLeave={() => setShowSettings(false)}
                                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                >
                                    <div className="py-1">
                                        <button onClick={() => { navigate('/settings/general'); setShowSettings(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">General</button>
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

export default Header;
