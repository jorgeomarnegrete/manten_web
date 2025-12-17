import React, { useState, useEffect } from 'react';
import { getPreventivePlans, deletePreventivePlan, checkAndRunPreventivePlans } from '../../api';

export default function PreventivePlans({ navigate }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const data = await getPreventivePlans();
            setPlans(data);
        } catch (error) {
            console.error("Error loading plans", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar este plan?")) {
            try {
                await deletePreventivePlan(id);
                loadPlans();
            } catch (error) {
                console.error("Error deleting plan", error);
            }
        }
    };

    const handleRunCheck = async () => {
        try {
            const res = await checkAndRunPreventivePlans();
            alert(`Se han generado ${res.generated_count} órdenes de trabajo.`);
            loadPlans();
        } catch (error) {
            console.error("Error running check", error);
            alert("Error al ejecutar la verificación");
        }
    };

    const getStatusColor = (nextRun) => {
        if (!nextRun) return 'bg-gray-100 text-gray-800';
        const today = new Date();
        const next = new Date(nextRun);
        const diffTime = next - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'bg-red-100 text-red-800'; // Overdue
        if (diffDays <= 7) return 'bg-yellow-100 text-yellow-800'; // Due soon
        return 'bg-green-100 text-green-800'; // Future
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Planes Preventivos</h1>
                    <p className="text-gray-600">Gestiona la frecuencia de mantenimiento de tus activos.</p>
                </div>
                <div className="space-x-4">
                    <button
                        onClick={handleRunCheck}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
                    >
                        Ejecutar Verificación
                    </button>
                    <button
                        onClick={() => navigate('/preventive/new')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                    >
                        + Nuevo Plan
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frecuencia</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próxima Ejecución</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {plans.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                        No hay planes registrados.
                                    </td>
                                </tr>
                            ) : (
                                plans.map((plan) => (
                                    <tr key={plan.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            Cada {plan.frequency_value} - {plan.frequency_type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(plan.next_run)}`}>
                                                {formatDate(plan.next_run)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(plan.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Eliminar
                                            </button>
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
