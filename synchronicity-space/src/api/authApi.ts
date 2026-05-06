import { API_BASE_URL } from "../App";

export async function register(userData: object) {
    console.log(userData);
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
    }
    return response.json();
}

export async function login(credentials: object) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
    }

    return response.json();
}
