import { login } from "../auth/auth.ts";

export default function Login() {
    return (
        <div style={{ padding: 24 }}>
            <h2>MyDepop</h2>
            <p>Sign in to upload a Depop CSV and view KPIs.</p>
            <button onClick={login}>Log in</button>
        </div>
    );
}
