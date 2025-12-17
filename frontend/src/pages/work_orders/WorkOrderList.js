import React, { useState, useEffect } from 'react';
import { getWorkOrders, updateWorkOrder, getAssets, getWorkers, createWorkOrder } from '../../api';

export default function WorkOrderList({ navigate }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [workers, setWorkers] = useState([]);
    const [assets, setAssets] = useState([]);

    const [editingId, setEditingId] = useState(null);

    const initialForm = {
        title: '',
        description: '',
        observations: '',
        asset_id: '',
        priority: 'MEDIA',
        requested_by_id: '',
        assigned_to_id: '',
        type: 'CORRECTIVO'
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        loadData();
    }, [filterStatus]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = filterStatus ? { status: filterStatus } : {};
            // Parallel load for efficiency
            const [ordersData, assetsData, workersData] = await Promise.all([
                getWorkOrders(params),
                getAssets(),
                getWorkers()
            ]);

            setOrders(ordersData);
            setAssets(assetsData);
            setWorkers(workersData);
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateWorkOrder(id, { status: newStatus });
            // Reload just orders to be quicker
            const params = filterStatus ? { status: filterStatus } : {};
            const data = await getWorkOrders(params);
            setOrders(data);
        } catch (error) {
            console.error("Error updating status", error);
            alert("Error al actualizar estado");
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!formData.requested_by_id) {
            alert("El campo 'Solicitante' es obligatorio.");
            return;
        }

        try {
            const payload = { ...formData };
            // Ensure IDs are integers or null/undefined
            payload.requested_by_id = parseInt(payload.requested_by_id);
            if (payload.asset_id) payload.asset_id = parseInt(payload.asset_id);
            else delete payload.asset_id;

            if (payload.assigned_to_id) payload.assigned_to_id = parseInt(payload.assigned_to_id);
            else delete payload.assigned_to_id;

            if (editingId) {
                await updateWorkOrder(editingId, payload);
            } else {
                await createWorkOrder(payload);
            }

            setShowModal(false);
            setFormData(initialForm);
            setEditingId(null);

            // Reload orders
            loadData();
        } catch (error) {
            console.error("Error saving work order", error);
            alert("Error al guardar OT: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleEdit = (wo) => {
        setEditingId(wo.id);
        setFormData({
            title: wo.title || '', // Assuming title exists in response or need to check schema usage
            description: wo.description || '',
            observations: wo.observations || '',
            asset_id: wo.asset_id || '',
            priority: wo.priority || 'MEDIA',
            requested_by_id: wo.requested_by_id || '',
            assigned_to_id: wo.assigned_to_id || '',
            type: wo.type || 'CORRECTIVO'
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData(initialForm);
        setShowModal(true);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'ALTA': return 'text-red-600 font-bold';
            case 'MEDIA': return 'text-yellow-600';
            case 'BAJA': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusBadge = (status) => {
        let colorClass = 'bg-gray-100 text-gray-800';
        if (status === 'PENDIENTE') colorClass = 'bg-yellow-100 text-yellow-800';
        if (status === 'ASIGNADA') colorClass = 'bg-blue-100 text-blue-800';
        if (status === 'EN_PROGRESO') colorClass = 'bg-purple-100 text-purple-800';
        if (status === 'COMPLETADA') colorClass = 'bg-green-100 text-green-800';
        if (status === 'CANCELADA') colorClass = 'bg-red-100 text-red-800';

        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>{status}</span>;
    };

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
                    <p className="text-gray-600">Gestiona las tareas de mantenimiento preventivo y correctivo.</p>
                </div>
                <div>
                    <select
                        className="border rounded-md p-2 mr-2"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="ASIGNADA">Asignada</option>
                        <option value="EN_PROGRESO">En Progreso</option>
                        <option value="COMPLETADA">Completada</option>
                    </select>

                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                    >
                        + Nueva OT Correctiva
                    </button>
                </div>
            </div>

            {loading ? (
                <div>Cargando...</div>
            ) : (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No hay órdenes de trabajo.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((wo) => (
                                    <tr key={wo.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {/* Maybe navigate to detail */ }}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{wo.ticket_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {/* Mostrar nombre del activo si existe */}
                                            {wo.asset ? wo.asset.name : '-'}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getPriorityColor(wo.priority)}`}>{wo.priority}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {getStatusBadge(wo.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(wo.created_at).toLocaleDateString('es-ES')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => handleEdit(wo)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                                            {wo.status !== 'COMPLETADA' && (
                                                <button onClick={() => handleStatusChange(wo.id, 'COMPLETADA')} className="text-green-600 hover:text-green-900 mr-2">Completar</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Creación */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Orden de Trabajo' : 'Nueva Orden Correctiva'}</h2>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Título Breve</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ej. Fuga de aceite"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Descripción Detallada *</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Observaciones (Técnico/Operador)</label>
                                <textarea
                                    rows="2"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.observations}
                                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                    placeholder="Detalles sobre la reparación, repuestos usados, etc."
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Activo (Máquina)</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.asset_id}
                                        onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                                    >
                                        <option value="">- Seleccionar Activo -</option>
                                        {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="BAJA">Baja</option>
                                        <option value="MEDIA">Media</option>
                                        <option value="ALTA">Alta</option>
                                        <option value="CRITICA">Crítica</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Solicitante (Encargado) *</label>
                                    <select
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.requested_by_id}
                                        onChange={(e) => setFormData({ ...formData, requested_by_id: e.target.value })}
                                    >
                                        <option value="">- Seleccionar Personal -</option>
                                        {workers.map(w => <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Asignado a (Técnico)</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.assigned_to_id}
                                        onChange={(e) => setFormData({ ...formData, assigned_to_id: e.target.value })}
                                    >
                                        <option value="">- Sin Asignar -</option>
                                        {workers.map(w => <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>)}
                                    </select>
                                </div>
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
                                    {editingId ? 'Guardar Cambios' : 'Crear Orden'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
