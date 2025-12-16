import React, { useEffect, useState } from 'react';
// import { useSearchParams } from 'react-router-dom';

export default function Billing({ navigate }) {
    // Mercado Pago redirects with: ?collection_id=...&collection_status=...&payment_id=...&status=...&external_reference=...&payment_type=...
    // Or for Preapproval: ?preapproval_id=...

    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);

        // Check for MP status params
        const collectionStatus = query.get('collection_status');
        const paymentStatus = query.get('status');
        const preapprovalId = query.get('preapproval_id');

        if (collectionStatus === 'approved' || paymentStatus === 'approved' || preapprovalId) {
            setStatus('success');
        } else if (collectionStatus === 'rejected' || paymentStatus === 'rejected') {
            setStatus('canceled'); // or failed
        } else if (collectionStatus === 'pending' || paymentStatus === 'pending') {
            setStatus('pending');
        } else if (query.get('canceled')) { // Generic generic cancel
            setStatus('canceled');
        } else {
            setStatus('active'); // Default/Return state
        }
    }, []);

    return (
        <div className="bg-white min-h-screen pt-20">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Facturación y Suscripción</h2>
                    <div className="mt-10 p-8 bg-gray-50 rounded-2xl shadow-sm border border-gray-100">
                        {status === 'success' && (
                            <div className="text-green-600">
                                <h3 className="text-xl font-semibold">¡Suscripción Exitosa!</h3>
                                <p className="mt-2 text-gray-600">Tu suscripción ha sido procesada correctamente por Mercado Pago.</p>
                                <button onClick={() => navigate('/')} className="mt-6 text-blue-600 hover:text-blue-500 font-medium">Ir al Dashboard</button>
                            </div>
                        )}
                        {status === 'pending' && (
                            <div className="text-yellow-600">
                                <h3 className="text-xl font-semibold">Pago Pendiente</h3>
                                <p className="mt-2 text-gray-600">Tu pago está siendo procesado. Te avisaremos cuando se confirme.</p>
                            </div>
                        )}
                        {status === 'canceled' && (
                            <div className="text-red-600">
                                <h3 className="text-xl font-semibold">Pago No Completado</h3>
                                <p className="mt-2 text-gray-600">El proceso de pago no se completó.</p>
                                <button onClick={() => navigate('/pricing')} className="mt-6 text-blue-600 hover:text-blue-500 font-medium">Volver a Precios</button>
                            </div>
                        )}
                        {status === 'active' && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">Estado de la Cuenta</h3>
                                <div className="mt-4 flex items-center justify-center gap-x-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
                                    </span>
                                    <p className="text-gray-600">Consultando estado...</p>
                                </div>
                                <p className="mt-4 text-sm text-gray-500">Para gestionar pagos, revisa tu correo de Mercado Pago.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
