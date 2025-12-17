import React, { useState, useEffect } from 'react';
import { createPreventivePlan, getAssets } from '../../api';

export default function PlanEditor({ navigate }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        frequency_type: 'MENSUAL',
        frequency_value: 1,
        asset_id: '',
        is_active: true
    });

    const [tasks, setTasks] = useState([
        { description: '', estimated_time: 0 }
    ]);

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        try {
            const data = await getAssets();
            setAssets(data);
        } catch (error) {
            console.error("Error loading assets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = () => {
        setTasks([...tasks, { description: '', estimated_time: 0 }]);
    };

    const handleRemoveTask = (index) => {
        const newTasks = [...tasks];
        newTasks.splice(index, 1);
        setTasks(newTasks);
    };

    const handleTaskChange = (index, field, value) => {
        const newTasks = [...tasks];
        newTasks[index][field] = value;
        setTasks(newTasks);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.asset_id) {
                alert("Debes seleccionar un activo");
                return;
            }

            const payload = {
                ...formData,
                tasks: tasks.filter(t => t.description.trim() !== '')
            };

            await createPreventivePlan(payload);
            alert("Plan creado exitosamente");
            navigate('/preventive/plans');
        } catch (error) {
            console.error("Error creating plan", error);
            alert("Error al crear el plan");
        }
    };

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo Plan Preventivo</h1>

            {loading ? <div>Cargando...</div> : (
                <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Nombre del Plan</label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Activo</label>
                            <select
                                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                value={formData.asset_id}
                                onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                                required
                            >
                                <option value="">Seleccione un activo...</option>
                                {assets.map(asset => (
                                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Frecuencia</label>
                            <select
                                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                value={formData.frequency_type}
                                onChange={(e) => setFormData({ ...formData, frequency_type: e.target.value })}
                            >
                                <option value="DIARIA">Diaria</option>
                                <option value="SEMANAL">Semanal</option>
                                <option value="MENSUAL">Mensual</option>
                                <option value="ANUAL">Anual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Valor (Cada cuánto)</label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="number"
                                min="1"
                                value={formData.frequency_value}
                                onChange={(e) => setFormData({ ...formData, frequency_value: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Checklist de Tareas</label>
                        {tasks.map((task, index) => (
                            <div key={index} className="flex gap-2 mb-2 items-center">
                                <span className="text-gray-500 w-6">{index + 1}.</span>
                                <input
                                    className="shadow appearance-none border rounded flex-grow py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    type="text"
                                    placeholder="Descripción de la tarea"
                                    value={task.description}
                                    onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                                    required
                                />
                                <input
                                    className="shadow appearance-none border rounded w-24 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    type="number"
                                    placeholder="Min"
                                    value={task.estimated_time}
                                    onChange={(e) => handleTaskChange(index, 'estimated_time', parseInt(e.target.value))}
                                />
                                <button type="button" onClick={() => handleRemoveTask(index)} className="text-red-500 font-bold px-2">X</button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddTask}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            + Agregar Tarea
                        </button>
                    </div>

                    <div className="flex items-center justify-end">
                        <button
                            type="button"
                            onClick={() => navigate('/preventive/plans')}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Guardar Plan
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
