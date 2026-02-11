import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp, confirmSignUp } from "../auth/auth";

export default function SignUp() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<"register" | "verify">("register");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signUp(email, password);
            setStep("verify");
        } catch (err: any) {
            setError(err.message ?? "Sign up failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await confirmSignUp(email, code);
            navigate("/login");
        } catch (err: any) {
            setError(err.message ?? "Verification failed");
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
                        {step === "register"
                            ? "Create an account to get started."
                            : "We sent a verification code to your email."}
                    </p>
                </div>

                {step === "register" ? (
                    <form onSubmit={handleRegister} className="space-y-4">
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
                                minLength={8}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="At least 8 characters"
                            />
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
                        >
                            {loading ? "Creating account..." : "Sign up"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Verification code
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-center tracking-widest"
                                placeholder="123456"
                                autoComplete="one-time-code"
                            />
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
                        >
                            {loading ? "Verifying..." : "Verify email"}
                        </button>
                    </form>
                )}

                <p className="mt-5 text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link to="/login" className="text-red-500 hover:text-red-600 font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
