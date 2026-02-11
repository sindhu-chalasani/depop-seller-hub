import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn } from "../auth/auth";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signIn(email, password);
            navigate("/");
        } catch (err: any) {
            setError(err.message ?? "Sign in failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Depop Seller Hub</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Sign in to view your sales analytics.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Enter your password"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-gray-500">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-red-500 hover:text-red-600 font-medium">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
