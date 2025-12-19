import React, { useState, useEffect } from 'react';
import { getPurchaseOrders, deletePurchaseOrder, getSuppliers } from '../../api';
import { useCompany } from '../../context/CompanyContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PurchaseOrderList = ({ navigate }) => {
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('PENDIENTES');
    const [supplierFilter, setSupplierFilter] = useState('');

    const { companyData, getLogoUrl } = useCompany();

    // ... (rest of existing code)

    const generatePDF = async (order) => {
        const doc = new jsPDF({ format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;
        let startY = 20;

        // --- Logo & Company Header ---
        const logoUrl = getLogoUrl();
        if (logoUrl) {
            console.log("PDF Logo URL:", logoUrl); // Debug logo URL
            try {
                const loadImage = (src) => new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = src;
                });
                const img = await loadImage(logoUrl);
                const imgWidth = 25;
                const imgHeight = (img.height * imgWidth) / img.width;
                doc.addImage(img, 'PNG', margin, margin, imgWidth, imgHeight);

                // Company Name
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text(companyData.name || 'MantenPro', margin + imgWidth + 5, margin + 8);
                doc.setFont("helvetica", "normal");
                startY = Math.max(startY, margin + imgHeight + 10);
            } catch (err) {
                console.warn("Logo load failed", err);
                doc.setFontSize(16);
                doc.text(companyData?.name || 'MantenPro', margin, 20);
                startY = 30;
            }
        } else {
            doc.setFontSize(16);
            doc.text(companyData?.name || 'MantenPro', margin, 20);
            startY = 30;
        }

        // --- Title & Order Info ---
        doc.setFontSize(18);
        doc.text(`ORDEN DE COMPRA #${order.order_number}`, margin, startY);

        doc.setFontSize(10);
        doc.text(`Fecha Emisión: ${order.order_date}`, margin, startY + 8);
        // doc.text(`Estado: ${order.status}`, margin, startY + 13); // Status removed
        if (order.delivery_date) {
            doc.text(`Fecha Entrega Est.: ${order.delivery_date}`, margin, startY + 13);
        }

        // --- Supplier Info ---
        const supplierY = startY + 25;
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, supplierY, pageWidth - (margin * 2), 25, 'F');

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Datos del Proveedor", margin + 5, supplierY + 8);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const sup = order.supplier || {};
        doc.text(`Razón Social: ${sup.name || 'N/A'}`, margin + 5, supplierY + 16);
        doc.text(`Email: ${sup.email || 'N/A'}`, margin + 5, supplierY + 21);
        // Add more supplier data if available in model (phone, address, etc)
        // doc.text(`Teléfono: ${sup.phone || ''}`, margin + 100, supplierY + 16); 

        // --- Items Table ---
        const tableData = order.items.map(item => [
            item.description,
            item.quantity,
            `$${Number(item.unit_price).toLocaleString()}`,
            `$${Number(item.total_price).toLocaleString()}` // Backend item has total_price? Yes, we saw schemas.
        ]);

        autoTable(doc, {
            startY: supplierY + 30,
            head: [['Descripción', 'Cant.', 'Precio Unit.', 'TotalLine']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' }
            },
            foot: [['', '', 'TOTAL COMPRA:', `$${Number(order.total_amount).toLocaleString()}`]],
            footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'right' }
        });

        // --- Signatures ---
        const finalY = doc.lastAutoTable.finalY || 150;
        const signatureY = pageHeight - 30;

        doc.setLineWidth(0.5);
        doc.line(margin, signatureY, margin + 60, signatureY);
        doc.setFontSize(9);
        doc.text('Firma Solicitante', margin, signatureY + 5);

        doc.line(pageWidth - margin - 60, signatureY, pageWidth - margin, signatureY);
        doc.text('Firma Autorizada (Gerencia)', pageWidth - margin - 60, signatureY + 5);

        // --- Footer ---
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Generado por MantenPro', margin, pageHeight - 10);

        window.open(doc.output('bloburl'), '_blank');
    };

    // ... existing loadData ...


    useEffect(() => {
        loadData();
    }, [statusFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, suppliersData] = await Promise.all([
                getPurchaseOrders({ status: statusFilter }),
                getSuppliers()
            ]);
            setOrders(ordersData);
            setSuppliers(suppliersData);
        } catch (error) {
            console.error("Error loading orders:", error);
            alert("Error al cargar órdenes de compra");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar esta orden de compra?')) {
            try {
                await deletePurchaseOrder(id);
                loadData();
            } catch (error) {
                console.error("Error deleting order:", error);
                alert("Error al eliminar orden");
            }
        }
    };

    // Client-side filtering for supplier name if user types
    const filteredOrders = orders.filter(order => {
        if (!supplierFilter) return true;
        const supplierName = order.supplier ? order.supplier.name.toLowerCase() : '';
        return supplierName.includes(supplierFilter.toLowerCase());
    });

    const getStatusBadge = (status) => {
        const styles = {
            'PENDIENTE': 'bg-yellow-100 text-yellow-800',
            'PARCIALMENTE_RECIBIDO': 'bg-blue-100 text-blue-800',
            'COMPLETADA': 'bg-green-100 text-green-800',
            'CANCELADA': 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Órdenes de Compra</h1>
                <button
                    onClick={() => navigate('/stock/purchase-orders/new')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Nueva Orden
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex space-x-2">
                    {['PENDIENTES', 'RECIBIDAS', 'TODAS'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${statusFilter === status
                                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status === 'PENDIENTES' ? 'Pendientes' : status === 'RECIBIDAS' ? 'Recibidas' : 'Todas'}
                        </button>
                    ))}
                </div>

                <div className="flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por proveedor..."
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        value={supplierFilter}
                        onChange={(e) => setSupplierFilter(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
                {loading ? (
                    <div className="p-4 text-center text-gray-500">Cargando...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No se encontraron órdenes de compra.</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrega Est.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.order_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.supplier ? order.supplier.name : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.delivery_date || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${Number(order.total_amount).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => navigate(`/stock/purchase-orders/${order.id}`)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                        >
                                            Editar/Ver
                                        </button>
                                        <button
                                            onClick={() => generatePDF(order)}
                                            className="text-gray-600 hover:text-gray-900 mr-3"
                                            title="Imprimir PDF"
                                        >
                                            🖨️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(order.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PurchaseOrderList;
