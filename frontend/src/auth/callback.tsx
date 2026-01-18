import { useEffect } from "react";

export default function Callback() {
    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get("code");
        if (!code) return;

        fetch(`${import.meta.env.VITE_COGNITO_DOMAIN}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
            redirect_uri: import.meta.env.VITE_REDIRECT_URI,
            code,
        }),
        })
        .then(res => res.json())
        .then(tokens => {
            localStorage.setItem("access_token", tokens.access_token);
            localStorage.setItem("id_token", tokens.id_token);

            window.location.href = "/";
        });
    }, []);

    return <p style={{ padding: 24 }}>Logging you in…</p>;
}