import React, { useState, useEffect } from 'react';
import { getWorkers, createWorker, updateWorker, deleteWorker, getSectors } from '../../api';

export default function Workers({ navigate }) {
    const [workers, setWorkers] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingWorker, setEditingWorker] = useState(null);

    // Initial State
    const initialForm = {
        first_name: '',
        last_name: '',
        rut_dni: '',
        email: '',
        phone: '',
        job_title: '',
        sector_id: '' // Optional
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [workersData, sectorsData] = await Promise.all([getWorkers(), getSectors()]);
            setWorkers(workersData);
            setSectors(sectorsData);
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    const getSectorName = (id) => {
        if (!id) return '-';
        const s = sectors.find(sec => sec.id === id);
        return s ? s.name : '-';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Ensure sector_id is int if provided, else undefined or null
            const payload = { ...formData };
            if (payload.sector_id) {
                payload.sector_id = parseInt(payload.sector_id);
            } else {
                delete payload.sector_id; // Remove empty string if optional
            }

            if (editingWorker) {
                await updateWorker(editingWorker.id, payload);
            } else {
                await createWorker(payload);
            }
            setShowModal(false);
            setEditingWorker(null);
            setFormData(initialForm);

            // Reload workers
            const refreshedWorkers = await getWorkers();
            setWorkers(refreshedWorkers);
        } catch (error) {
            console.error("Error saving worker", error);
            alert("Error al guardar personal: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleEdit = (worker) => {
        setEditingWorker(worker);
        setFormData({
            first_name: worker.first_name,
            last_name: worker.last_name,
            rut_dni: worker.rut_dni || '',
            email: worker.email || '',
            phone: worker.phone || '',
            job_title: worker.job_title || '',
            sector_id: worker.sector_id || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar a este trabajador?")) {
            try {
                await deleteWorker(id);
                setWorkers(workers.filter(w => w.id !== id));
            } catch (error) {
                console.error("Error deleting worker", error);
            }
        }
    };

    const openCreateModal = () => {
        setEditingWorker(null);
        setFormData(initialForm);
        setShowModal(true);
    };

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Personal</h1>
                    <p className="text-gray-600">Gestión de empleados y técnicos.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                    + Nuevo Personal
                </button>
            </div>

            {loading ? (
                <div>Cargando...</div>
            ) : (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector (Default)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {workers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                        No hay personal registrado.
                                    </td>
                                </tr>
                            ) : (
                                workers.map((worker) => (
                                    <tr key={worker.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {worker.first_name} {worker.last_name}
                                            <div className="text-xs text-gray-500">{worker.rut_dni}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.job_title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getSectorName(worker.sector_id)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{worker.email}</div>
                                            <div className="text-xs">{worker.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(worker)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                                            <button onClick={() => handleDelete(worker.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">{editingWorker ? 'Editar Personal' : 'Nuevo Personal'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                    <input
                                        type="text" required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Apellido</label>
                                    <input
                                        type="text" required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">RUT / DNI</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.rut_dni} onChange={(e) => setFormData({ ...formData, rut_dni: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Cargo</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sector Asignado (Opcional)</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                    value={formData.sector_id} onChange={(e) => setFormData({ ...formData, sector_id: e.target.value })}
                                >
                                    <option value="">- Ninguno -</option>
                                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Si se selecciona, será el sector por defecto del trabajador.</p>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
