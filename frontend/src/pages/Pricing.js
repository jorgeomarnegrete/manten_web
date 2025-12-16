import React, { useEffect, useState } from 'react';
import { getPlans, createCheckoutSession } from '../api';

export default function Pricing({ navigate }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await getPlans();
                setPlans(data);
            } catch (err) {
                console.error("Error fetching plans:", err);
                // Fallback for demo if backend has no plans yet
                // setPlans([
                //    { id: 1, name: "Basic", price: 29.99, currency: "usd", interval: "month" },
                //    { id: 2, name: "Pro", price: 79.99, currency: "usd", interval: "month" }
                // ]);
                setError("No se pudieron cargar los planes.");
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleSubscribe = async (planId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Debes iniciar sesión para suscribirte.");
            navigate('/login');
            return;
        }
        try {
            const { init_point } = await createCheckoutSession(planId);
            window.location.href = init_point;
        } catch (err) {
            console.error("Checkout error:", err);
            // Mostrar mensaje real del backend si existe, o uno genérico
            const msg = err.response?.data?.detail || err.message || "Error desconocido";
            alert(`Error: ${msg}`);
        }
    };

    if (loading) return <div className="text-center mt-10">Cargando planes...</div>;

    return (
        <div className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-blue-600">Precios</h2>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        Planes para todos los tamaños
                    </p>
                </div>
                {error && <p className="text-center text-red-500 mt-4">{error}</p>}

                <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                    {plans.map((plan) => (
                        <div key={plan.id} className="flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10 hover:shadow-lg transition-shadow">
                            <div>
                                <h3 className="text-lg font-semibold leading-8 text-gray-900">{plan.name}</h3>
                                <p className="mt-4 text-sm leading-6 text-gray-600">Perfecto para empezar.</p>
                                <p className="mt-6 flex items-baseline gap-x-1">
                                    <span className="text-4xl font-bold tracking-tight text-gray-900">${plan.price}</span>
                                    <span className="text-sm font-semibold leading-6 text-gray-600">/{plan.interval}</span>
                                </p>
                                <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                                    <li className="flex gap-x-3">✔ Funcionalidades básicas</li>
                                    <li className="flex gap-x-3">✔ Soporte por correo</li>
                                    <li className="flex gap-x-3">✔ Hasta 5 usuarios</li>
                                </ul>
                            </div>
                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                className="mt-8 block w-full rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                Suscribirse
                            </button>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-500">Volver al inicio</button>
                </div>
            </div>
        </div>
    );
}
