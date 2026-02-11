export async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("access_token");

    const headers: Record<string, string> = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE}${path}`, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });

    if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("id_token");
        window.location.href = "/login";
        throw new Error("Session expired");
    }

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API ${response.status}: ${text}`);
    }

    //some endpoints may return empty body so handle safely
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }
    return response.text();
}
