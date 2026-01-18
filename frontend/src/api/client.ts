export async function apiFetch(path: string, options: RequestInit = {}) {
    const response = await fetch(`${import.meta.env.VITE_API_BASE}${path}`, {
        ...options,
        headers: {
        ...options.headers,
        },
    });

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