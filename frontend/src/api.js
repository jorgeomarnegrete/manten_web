const API_URL = 'http://localhost:8000';

export async function login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Fallo en el inicio de sesión');
    }

    return response.json();
}

export async function register(companyData) {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Fallo en el registro');
    }

    return response.json();
}
