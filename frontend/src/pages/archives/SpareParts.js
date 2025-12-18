import React, { useState, useEffect } from 'react';
import {
    getSpareParts, createSparePart, updateSparePart, deleteSparePart,
    getSparePartCategories, createSparePartCategory, deleteSparePartCategory
} from '../../api';

export default function SpareParts({ navigate }) {
    const [parts, setParts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showPartModal, setShowPartModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingPart, setEditingPart] = useState(null);

    // Form States
    const initialPartForm = { name: '', internal_code: '', cost: '0', currency: 'ARS', stock: '0', category_id: '' };
    const [partForm, setPartForm] = useState(initialPartForm);

    const [categoryName, setCategoryName] = useState('');
    const [categoryDesc, setCategoryDesc] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [partsData, catsData] = await Promise.all([
                getSpareParts(),
                getSparePartCategories()
            ]);
            setParts(partsData);
            setCategories(catsData);
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    // --- PART HANDLERS ---
    const handleOpenPartModal = (part = null) => {
        if (part) {
            setEditingPart(part);
            setPartForm({
                name: part.name,
                internal_code: part.internal_code || '',
                cost: part.cost,
                currency: part.currency,
                stock: part.stock,
                category_id: part.category_id || ''
            });
        } else {
            setEditingPart(null);
            setPartForm(initialPartForm);
        }
        setShowPartModal(true);
    };

    const handlePartSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...partForm,
                cost: parseFloat(partForm.cost),
                stock: parseInt(partForm.stock),
                category_id: partForm.category_id ? parseInt(partForm.category_id) : null
            };

            if (editingPart) {
                await updateSparePart(editingPart.id, payload);
            } else {
                await createSparePart(payload);
            }
            setShowPartModal(false);
            loadData();
        } catch (error) {
            console.error("Error saving part", error);
            alert("Error al guardar repuesto");
        }
    };

    const handleDeletePart = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este repuesto?")) return;
        try {
            await deleteSparePart(id);
            loadData();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar");
        }
    };

    // --- CATEGORY HANDLERS ---
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            await createSparePartCategory({ name: categoryName, description: categoryDesc });
            setCategoryName('');
            setCategoryDesc('');
            setShowCategoryModal(false);
            loadData();
        } catch (error) {
            console.error(error);
            alert("Error al crear categoría");
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("¿Eliminar rubro? Esto podría afectar a los repuestos asociados.")) return;
        try {
            await deleteSparePartCategory(id);
            loadData();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar categoría");
        }
    };

    const filteredParts = parts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.internal_code && p.internal_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Repuestos e Inventario</h1>
                    <p className="text-gray-600">Gestiona stock, costos y rubros de repuestos.</p>
                </div>
                <div className="space-x-2">
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium"
                    >
                        Gestionar Rubros
                    </button>
                    <button
                        onClick={() => handleOpenPartModal()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                    >
                        + Nuevo Repuesto
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div>Cargando...</div>
            ) : (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rubro</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Unit.</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredParts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No se encontraron repuestos.</td>
                                </tr>
                            ) : (
                                filteredParts.map((p) => {
                                    const cat = categories.find(c => c.id === p.category_id);
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.internal_code || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat ? cat.name : '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{p.stock}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.currency} ${p.cost}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleOpenPartModal(p)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                                                <button onClick={() => handleDeletePart(p.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PART MODAL */}
            {showPartModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingPart ? 'Editar Repuesto' : 'Nuevo Repuesto'}</h2>
                        <form onSubmit={handlePartSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={partForm.name} onChange={e => setPartForm({ ...partForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Código Interno (SKU)</label>
                                <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={partForm.internal_code} onChange={e => setPartForm({ ...partForm, internal_code: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rubro</label>
                                    <select className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        value={partForm.category_id} onChange={e => setPartForm({ ...partForm, category_id: e.target.value })}>
                                        <option value="">- Ninguno -</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                                    <input type="number" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        value={partForm.stock} onChange={e => setPartForm({ ...partForm, stock: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Costo</label>
                                    <input type="number" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        value={partForm.cost} onChange={e => setPartForm({ ...partForm, cost: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Moneda</label>
                                    <select className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        value={partForm.currency} onChange={e => setPartForm({ ...partForm, currency: e.target.value })}>
                                        <option value="ARS">ARS</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowPartModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-md">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CATEGORY MODAL */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Gestionar Rubros</h2>
                            <button onClick={() => setShowCategoryModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-sm font-semibold mb-2">Crear Nuevo Rubro</h3>
                            <form onSubmit={handleCategorySubmit} className="flex gap-2">
                                <input required type="text" placeholder="Nombre (ej. Filtros)" className="flex-1 border border-gray-300 rounded-md p-2"
                                    value={categoryName} onChange={e => setCategoryName(e.target.value)} />
                                <button type="submit" className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700">Agregar</button>
                            </form>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold mb-2">Rubros Existentes</h3>
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                                <ul className="divide-y divide-gray-200">
                                    {categories.length === 0 ? (
                                        <li className="p-3 text-sm text-gray-500 text-center">No hay rubros creados</li>
                                    ) : (
                                        categories.map(c => (
                                            <li key={c.id} className="p-3 flex justify-between items-center bg-gray-50">
                                                <span className="text-sm font-medium">{c.name}</span>
                                                <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:text-red-700 text-xs">Eliminar</button>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
