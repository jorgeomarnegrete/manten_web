import React, { useState, useEffect } from 'react';
import {
    getSuppliers, createSupplier, updateSupplier, deleteSupplier,
    getSparePartCategories
} from '../../api';

export default function Suppliers({ navigate }) {
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]); // Rubros
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategoryId, setFilterCategoryId] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);

    // Form
    const initialForm = {
        name: '', address: '', city: '', phone: '', email: '',
        contact_name: '', contact_phone: '', category_ids: []
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [supData, catData] = await Promise.all([
                getSuppliers(),
                getSparePartCategories()
            ]);
            setSuppliers(supData);
            setCategories(catData);
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (sup = null) => {
        if (sup) {
            setEditingSupplier(sup);
            setFormData({
                name: sup.name,
                address: sup.address || '',
                city: sup.city || '',
                phone: sup.phone || '',
                email: sup.email || '',
                contact_name: sup.contact_name || '',
                contact_phone: sup.contact_phone || '',
                category_ids: sup.categories ? sup.categories.map(c => c.id) : []
            });
        } else {
            setEditingSupplier(null);
            setFormData(initialForm);
        }
        setShowModal(true);
    };

    const handleCategoryToggle = (catId) => {
        const currentIds = formData.category_ids;
        if (currentIds.includes(catId)) {
            setFormData({ ...formData, category_ids: currentIds.filter(id => id !== catId) });
        } else {
            setFormData({ ...formData, category_ids: [...currentIds, catId] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, formData);
            } else {
                await createSupplier(formData);
            }
            setShowModal(false);
            loadData();
        } catch (error) {
            console.error(error);
            alert("Error al guardar proveedor");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar proveedor?")) return;
        try {
            await deleteSupplier(id);
            loadData();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar");
        }
    };

    // Filter Logic
    const filteredSuppliers = suppliers.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.contact_name && s.contact_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = filterCategoryId === '' ||
            (s.categories && s.categories.some(c => c.id === parseInt(filterCategoryId)));

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
                    <p className="text-gray-600">Gestión de proveedores y sus rubros.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                    + Nuevo Proveedor
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o contacto..."
                        className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-1/3">
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                        value={filterCategoryId}
                        onChange={(e) => setFilterCategoryId(e.target.value)}
                    >
                        <option value="">Todos los Rubros</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rubros</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono / Email</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No se encontraron proveedores.</td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{s.name}</div>
                                            <div className="text-xs text-gray-500">{s.city}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {s.categories && s.categories.map(c => (
                                                    <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        {c.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.contact_name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{s.phone}</div>
                                            <div className="text-xs">{s.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleOpenModal(s)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                                            <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre Empresa</label>
                                    <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ciudad/Localidad</label>
                                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Dirección</label>
                                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>
                            </div>

                            <hr className="my-4" />
                            <h3 className="text-md font-semibold text-gray-900">Datos de Contacto</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre Contacto</label>
                                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Teléfono Contacto</label>
                                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                        value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} />
                                </div>
                            </div>

                            <hr className="my-4" />
                            <h3 className="text-md font-semibold text-gray-900">Rubros Asociados</h3>
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                {categories.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay rubros creados.</p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {categories.map(c => (
                                            <label key={c.id} className="inline-flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={formData.category_ids.includes(c.id)}
                                                    onChange={() => handleCategoryToggle(c.id)}
                                                />
                                                <span className="text-sm text-gray-700">{c.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-md">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
