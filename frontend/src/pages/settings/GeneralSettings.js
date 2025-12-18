import React, { useState, useEffect } from 'react';
import { getCompanySettings, updateCompanySettings, uploadCompanyLogo, API_URL } from '../../api';

const PROVINCES = [
    "Buenos Aires", "Ciudad Autónoma de Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"
];

const GeneralSettings = () => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        postal_code: '',
        province: '',
        phone: '',
        email_contact: '',
        logo_url: ''
    });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await getCompanySettings();
            setFormData({
                name: data.name || '',
                address: data.address || '',
                city: data.city || '',
                postal_code: data.postal_code || '',
                province: data.province || '',
                phone: data.phone || '',
                email_contact: data.email_contact || '',
                logo_url: data.logo_url || ''
            });
        } catch (error) {
            console.error("Error loading settings:", error);
            setMessage({ type: 'error', text: 'Error al cargar la configuración.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const res = await uploadCompanyLogo(file);
            setFormData(prev => ({ ...prev, logo_url: res.logo_url }));
            setMessage({ type: 'success', text: 'Logo actualizado correctamente.' });
        } catch (error) {
            console.error("Error uploading logo:", error);
            setMessage({ type: 'error', text: 'Error al subir el logo.' });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await updateCompanySettings(formData);
            setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
        } catch (error) {
            console.error("Error updating settings:", error);
            setMessage({ type: 'error', text: 'Error al guardar la configuración.' });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !formData.name) return <div className="p-8 text-center text-gray-500">Cargando configuración...</div>;

    const logoSrc = formData.logo_url
        ? (formData.logo_url.startsWith('http') ? formData.logo_url : `${API_URL}${formData.logo_url}`)
        : null;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
                <div className="bg-blue-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Configuración General</h2>
                    <p className="text-blue-100 text-sm">Administra la información de tu empresa</p>
                </div>

                <div className="p-6">
                    {message.text && (
                        <div className={`mb-4 p-4 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Logo Section */}
                        <div className="col-span-1 flex flex-col items-center space-y-4">
                            <div className="w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden relative">
                                {logoSrc ? (
                                    <img src={logoSrc} alt="Company Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-400 text-sm p-4 text-center">Sin Logo</span>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <span className="text-white text-xs">Subiendo...</span>
                                    </div>
                                )}
                            </div>
                            <div className="w-full text-center">
                                <label className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Cambiar Logo
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 text-center">Recomendado: PNG o JPG, 500x500px</p>
                        </div>

                        {/* Form Section */}
                        <div className="col-span-1 md:col-span-2">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Dirección</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Código Postal</label>
                                        <input
                                            type="text"
                                            name="postal_code"
                                            value={formData.postal_code}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Provincia</label>
                                        <select
                                            name="province"
                                            value={formData.province}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        >
                                            <option value="">Seleccione una provincia</option>
                                            {PROVINCES.map(prov => (
                                                <option key={prov} value={prov}>{prov}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email de Contacto</label>
                                        <input
                                            type="email"
                                            name="email_contact"
                                            value={formData.email_contact}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Guardando...' : 'Guardar Configuración'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettings;
