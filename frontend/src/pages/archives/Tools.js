import React, { useState, useEffect } from 'react';
import { getTools, createTool, updateTool, deleteTool, getSectors, getWorkers } from '../../api';

export default function Tools({ navigate }) {
    const [tools, setTools] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTool, setEditingTool] = useState(null);

    // Initial State
    const initialForm = {
        name: '',
        code: '',
        brand: '',
        status: 'AVAILABLE',
        assignment_type: 'NONE', // NONE, WORKER, SECTOR (Frontend helper state)
        current_worker_id: '',
        current_sector_id: ''
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [toolsData, sectorsData, workersData] = await Promise.all([getTools(), getSectors(), getWorkers()]);
            setTools(toolsData);
            setSectors(sectorsData);
            setWorkers(workersData);
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    const getAssigneeName = (tool) => {
        if (tool.current_worker_id) {
            const w = workers.find(w => w.id === tool.current_worker_id);
            return w ? `👤 ${w.first_name} ${w.last_name}` : '👤 Personal desconocido';
        }
        if (tool.current_sector_id) {
            const s = sectors.find(sec => sec.id === tool.current_sector_id);
            return s ? `🏭 ${s.name}` : '🏭 Sector desconocido';
        }
        return <span className="text-gray-400">Sin asignar</span>;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                brand: formData.brand,
                status: formData.status,
                current_worker_id: null,
                current_sector_id: null
            };

            // Handle assignment logic based on type
            if (formData.assignment_type === 'WORKER' && formData.current_worker_id) {
                payload.current_worker_id = parseInt(formData.current_worker_id);
                payload.status = 'IN_USE'; // Auto-update status if assigned? Optional.
            } else if (formData.assignment_type === 'SECTOR' && formData.current_sector_id) {
                payload.current_sector_id = parseInt(formData.current_sector_id);
                payload.status = 'IN_USE';
            }

            if (editingTool) {
                await updateTool(editingTool.id, payload);
            } else {
                await createTool(payload);
            }
            setShowModal(false);
            setEditingTool(null);
            setFormData(initialForm);

            // Reload tools
            const refreshedTools = await getTools();
            setTools(refreshedTools);
        } catch (error) {
            console.error("Error saving tool", error);
            alert("Error al guardar herramienta: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleEdit = (tool) => {
        setEditingTool(tool);

        let type = 'NONE';
        if (tool.current_worker_id) type = 'WORKER';
        else if (tool.current_sector_id) type = 'SECTOR';

        setFormData({
            name: tool.name,
            code: tool.code || '',
            brand: tool.brand || '',
            status: tool.status,
            assignment_type: type,
            current_worker_id: tool.current_worker_id || '',
            current_sector_id: tool.current_sector_id || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar esta herramienta?")) {
            try {
                await deleteTool(id);
                setTools(tools.filter(t => t.id !== id));
            } catch (error) {
                console.error("Error deleting tool", error);
            }
        }
    };

    const openCreateModal = () => {
        setEditingTool(null);
        setFormData(initialForm);
        setShowModal(true);
    };

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Herramientas</h1>
                    <p className="text-gray-600">Inventario y control de asignaciones.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                    + Nueva Herramienta
                </button>
            </div>

            {loading ? (
                <div>Cargando...</div>
            ) : (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre / Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignado a</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tools.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                        No hay herramientas registradas.
                                    </td>
                                </tr>
                            ) : (
                                tools.map((tool) => (
                                    <tr key={tool.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {tool.name}
                                            <div className="text-xs text-gray-500">{tool.code}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tool.brand}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${tool.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                                                    tool.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' :
                                                        tool.status === 'BROKEN' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {tool.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getAssigneeName(tool)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(tool)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                                            <button onClick={() => handleDelete(tool.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
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
                        <h2 className="text-xl font-bold mb-4">{editingTool ? 'Editar Herramienta' : 'Nueva Herramienta'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                    <input
                                        type="text" required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Código / SKU</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Marca</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="AVAILABLE">Disponible</option>
                                        <option value="IN_USE">En Uso</option>
                                        <option value="BROKEN">Rota/Averiada</option>
                                        <option value="LOST">Perdida</option>
                                    </select>
                                </div>
                            </div>

                            <hr className="border-gray-200 my-4" />
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Asignación</h3>

                            <div className="space-y-3">
                                <div className="flex items-center space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio" className="form-radio text-blue-600"
                                            name="assignment_type" value="NONE"
                                            checked={formData.assignment_type === 'NONE'}
                                            onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                                        />
                                        <span className="ml-2">Sin asignar (En depósito)</span>
                                    </label>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio" className="form-radio text-blue-600"
                                            name="assignment_type" value="WORKER"
                                            checked={formData.assignment_type === 'WORKER'}
                                            onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                                        />
                                        <span className="ml-2">Asignar a Personal</span>
                                    </label>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio" className="form-radio text-blue-600"
                                            name="assignment_type" value="SECTOR"
                                            checked={formData.assignment_type === 'SECTOR'}
                                            onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                                        />
                                        <span className="ml-2">Asignar a Sector</span>
                                    </label>
                                </div>
                            </div>

                            {/* Dropdowns based on selection */}
                            {formData.assignment_type === 'WORKER' && (
                                <div className="mt-2 pl-6">
                                    <select
                                        required
                                        className="block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-blue-50"
                                        value={formData.current_worker_id} onChange={(e) => setFormData({ ...formData, current_worker_id: e.target.value })}
                                    >
                                        <option value="">Selecciona Personal...</option>
                                        {workers.map(w => <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>)}
                                    </select>
                                </div>
                            )}

                            {formData.assignment_type === 'SECTOR' && (
                                <div className="mt-2 pl-6">
                                    <select
                                        required
                                        className="block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-blue-50"
                                        value={formData.current_sector_id} onChange={(e) => setFormData({ ...formData, current_sector_id: e.target.value })}
                                    >
                                        <option value="">Selecciona Sector...</option>
                                        {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}

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
