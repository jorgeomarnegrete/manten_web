import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Dashboard = ({ navigate }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando dashboard...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Error al cargar datos.</div>;

    const COLORS = ['#0088FE', '#FF8042']; // Blue (Preventive), Orange (Corrective) quite standard

    // Validate data for Chart
    const pieData = [
        { name: 'Preventivo', value: stats.yearly_stats.preventive },
        { name: 'Correctivo', value: stats.yearly_stats.corrective },
    ];

    // If no data, show empty state in chart
    const hasChartData = stats.yearly_stats.total > 0;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel de Control</h1>

            {/* Top Cards - Status Counts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-400">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase">Pendientes</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.counts.pending}</p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <span className="text-2xl">⏳</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase">En Progreso</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.counts.in_progress}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <span className="text-2xl">🔧</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase">Pausadas</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.counts.paused}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <span className="text-2xl">⏸️</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Mantenimiento Anual ({new Date().getFullYear()})</h2>
                    <div className="h-64 w-full flex items-center justify-center">
                        {hasChartData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-400 text-sm">No hay datos registrados este año.</div>
                        )}
                    </div>
                    <div className="text-center mt-4 text-sm text-gray-600">
                        Total OTs: <span className="font-bold">{stats.yearly_stats.total}</span>
                    </div>
                </div>

                {/* Recent Activity List */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Actividad Reciente</h2>
                        <button onClick={() => navigate('/work-orders')} className="text-blue-600 text-sm hover:underline">Ver todas</button>
                    </div>

                    <div className="overflow-hidden">
                        {stats.recent_activity.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">Sin actividad reciente.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {stats.recent_activity.map((order) => (
                                    <li key={order.id} className="py-3 hover:bg-gray-50 cursor-pointer rounded px-2 transition-colors" onClick={() => navigate('/work-orders')}>
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">#{order.ticket_number} - {order.title || 'Sin Título'}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-xs">{order.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${order.status === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                                        order.status === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                                <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
