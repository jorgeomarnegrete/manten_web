import React, { useState, useEffect } from 'react';
import { getWorkOrders, updateWorkOrder } from '../../api';

export default function WorkOrderList({ navigate }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        loadOrders();
    }, [filterStatus]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const params = filterStatus ? { status: filterStatus } : {};
            const data = await getWorkOrders(params);
            setOrders(data);
        } catch (error) {
            console.error("Error loading work orders", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateWorkOrder(id, { status: newStatus });
            loadOrders(); // Refresh to reflect changes/dates
        } catch (error) {
            console.error("Error updating status", error);
        }
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
                    {/* Add Create Manual OT button later */}
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
        </div>
    );
}
