export function login() {
    const params = new URLSearchParams({
        client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
        response_type: "code",
        scope: "openid email profile",
        redirect_uri: import.meta.env.VITE_REDIRECT_URI,
    });

    window.location.href = `${import.meta.env.VITE_COGNITO_DOMAIN}/login?${params.toString()}`;
}