import React, { useState, useEffect } from 'react';
import {
    createPurchaseOrder,
    getPurchaseOrder,
    updatePurchaseOrderStock,
    getSuppliers,
    getSpareParts
} from '../../api';

const PurchaseOrderEditor = ({ navigate }) => {
    const [id, setId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        order_number: '',
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: '',
        supplier_id: '',
        observations: '',
        items: []
    });

    // Lists for Selects
    const [suppliers, setSuppliers] = useState([]);
    const [spareParts, setSpareParts] = useState([]);

    useEffect(() => {
        // Parse ID from URL
        const pathParts = window.location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart !== 'new') {
            setId(lastPart);
        }

        loadDependencies();
    }, []);

    useEffect(() => {
        if (id) {
            loadOrder(id);
        }
    }, [id]);

    const loadDependencies = async () => {
        try {
            const [suppliersData, partsData] = await Promise.all([
                getSuppliers(),
                getSpareParts()
            ]);
            setSuppliers(suppliersData);
            setSpareParts(partsData);
        } catch (error) {
            console.error("Error loading dependencies:", error);
            alert("Error al cargar datos auxiliares");
        }
    };

    const loadOrder = async (orderId) => {
        setLoading(true);
        try {
            const data = await getPurchaseOrder(orderId);
            setFormData({
                order_number: data.order_number,
                order_date: data.order_date,
                delivery_date: data.delivery_date || '',
                supplier_id: data.supplier_id,
                observations: data.observations || '',
                items: data.items.map(item => ({
                    ...item,
                    // Ensure numeric fields are numbers for inputs
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    received_quantity: Number(item.received_quantity)
                }))
            });
        } catch (error) {
            console.error("Error loading order:", error);
            alert("Error al cargar la orden");
            navigate('/stock/purchase-orders');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Item Management
    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    spare_part_id: '',
                    description: '',
                    quantity: 1,
                    unit_price: 0,
                    received_quantity: 0
                }
            ]
        }));
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        // Auto-fill description/price if spare part selected
        if (field === 'spare_part_id') {
            const part = spareParts.find(p => p.id === parseInt(value));
            if (part) {
                newItems[index].description = part.name;
                newItems[index].unit_price = part.cost || 0;
            }
        }

        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.supplier_id) return alert("Seleccione un proveedor");
        if (formData.items.length === 0) return alert("Agregue al menos un ítem");

        setSaving(true);
        try {
            const payload = {
                ...formData,
                supplier_id: parseInt(formData.supplier_id),
                delivery_date: formData.delivery_date ? formData.delivery_date : null,
                observations: formData.observations || null,
                items: formData.items.map(item => {
                    const cleanedItem = {
                        ...item,
                        quantity: Number(item.quantity),
                        unit_price: Number(item.unit_price),
                        received_quantity: Number(item.received_quantity),
                        spare_part_id: item.spare_part_id ? parseInt(item.spare_part_id) : null
                    };
                    // Backend Pydantic v1 validation error "none is not an allowed value" for Optional[date] if explicit null sent
                    if (!cleanedItem.received_date) delete cleanedItem.received_date;
                    return cleanedItem;
                })
            };

            if (id) {
                await updatePurchaseOrderStock(id, payload);
                alert("Orden actualizada correctamente");
            } else {
                await createPurchaseOrder(payload);
                alert("Orden creada correctamente");
            }
            navigate('/stock/purchase-orders');
        } catch (error) {
            console.error("Error saving order:", error);
            alert("Error al guardar la orden");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Cargando orden...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{id ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Card */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Datos Generales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Número de Orden</label>
                            <input
                                type="text"
                                name="order_number"
                                placeholder={!id ? "Generado automáticamente" : ""}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                value={formData.order_number}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha</label>
                            <input
                                type="date"
                                name="order_date"
                                required
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                value={formData.order_date}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                            <select
                                name="supplier_id"
                                required
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                value={formData.supplier_id}
                                onChange={handleChange}
                            >
                                <option value="">Seleccione un proveedor</option>
                                {suppliers.map(sup => (
                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha Entrega Estimada</label>
                            <input
                                type="date"
                                name="delivery_date"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                value={formData.delivery_date}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                            <textarea
                                name="observations"
                                rows="2"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                value={formData.observations}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Items Card */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg font-medium text-gray-900">Items</h2>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                        >
                            + Agregar Item
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Repuesto / Producto</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Cant.</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Precio Unit.</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Total</th>
                                    {id && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Recibido</th>}
                                    <th className="px-3 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {formData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-2 py-2">
                                            <select
                                                value={item.spare_part_id}
                                                onChange={(e) => handleItemChange(index, 'spare_part_id', e.target.value)}
                                                className="block w-full text-sm border-gray-300 rounded-md shadow-sm p-1 border mb-1"
                                            >
                                                <option value="">Seleccione...</option>
                                                {spareParts.map(part => (
                                                    <option key={part.id} value={part.id}>{part.name} ({part.internal_code})</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Descripción"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                className="block w-full text-sm border-gray-300 rounded-md shadow-sm p-1 border"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                className="block w-full text-sm border-gray-300 rounded-md shadow-sm p-1 border text-right"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                                className="block w-full text-sm border-gray-300 rounded-md shadow-sm p-1 border text-right"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right text-sm">
                                            ${(item.quantity * item.unit_price).toLocaleString()}
                                        </td>
                                        {id && (
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={item.quantity}
                                                    value={item.received_quantity}
                                                    onChange={(e) => handleItemChange(index, 'received_quantity', e.target.value)}
                                                    className="block w-full text-sm border-green-300 rounded-md shadow-sm p-1 border text-right bg-green-50"
                                                />
                                            </td>
                                        )}
                                        <td className="px-2 py-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(index)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={id ? 4 : 3} className="px-3 py-4 text-right font-bold text-gray-900 border-t">Total Orden:</td>
                                    <td className="px-3 py-4 text-right font-bold text-gray-900 border-t">${calculateTotal().toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/stock/purchase-orders')}
                        className="bg-white text-gray-700 border border-gray-300 font-medium py-2 px-4 rounded shadow-sm hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white font-medium py-2 px-4 rounded shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Guardar Orden'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PurchaseOrderEditor;
