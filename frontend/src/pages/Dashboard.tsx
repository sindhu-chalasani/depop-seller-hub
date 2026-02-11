import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { logout } from "../auth/auth";
import { UploadCsv } from "../components/UploadCsv";
import { KpiCards } from "../components/KpiCards";
import type { Summary } from "../components/KpiCards";
import { RevenueChart } from "../components/RevenueChart";
import { CategoryChart } from "../components/CategoryChart";

type MonthlySales = {
    month: string;
    revenue_cents: number;
    profit_cents: number;
    units_sold: number;
};

type CategoryBreakdown = {
    category: string;
    revenue_cents: number;
    units_sold: number;
};

export default function Dashboard() {
    const [sellerUsername, setSellerUsername] = useState<string>("demo");
    const [kpis, setKpis] = useState<Summary | null>(null);
    const [salesOverTime, setSalesOverTime] = useState<MonthlySales[]>([]);
    const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    async function loadAll(username: string) {
        setError("");
        setLoading(true);
        setKpis(null);

        try {
            const [summary, timeSeries, categories] = await Promise.all([
                apiFetch(`/sellers/${username}/summary`),
                apiFetch(`/sellers/${username}/sales-over-time`),
                apiFetch(`/sellers/${username}/category-breakdown`),
            ]);
            setKpis(summary as Summary);
            setSalesOverTime(timeSeries as MonthlySales[]);
            setCategoryData(categories as CategoryBreakdown[]);
        } catch (err: any) {
            setError(err.message ?? "Failed to load data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll(sellerUsername);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Nav bar */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-900">Depop Seller Hub</h1>
                    <button
                        onClick={logout}
                        className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                    >
                        Log out
                    </button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                {/* Seller + controls card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Seller username
                            </label>
                            <input
                                value={sellerUsername}
                                onChange={(e) => setSellerUsername(e.target.value)}
                                className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="e.g. demo"
                            />
                        </div>

                        <button
                            onClick={() => loadAll(sellerUsername)}
                            disabled={loading}
                            className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </button>
                    </div>
                </div>

                {/* Upload card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">Upload Sales CSV</h2>
                    <UploadCsv
                        sellerUsername={sellerUsername}
                        onUploaded={() => loadAll(sellerUsername)}
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                {/* KPI Cards */}
                {kpis && <KpiCards kpis={kpis} />}

                {/* Charts */}
                {kpis && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RevenueChart data={salesOverTime} />
                        <CategoryChart data={categoryData} />
                    </div>
                )}
            </main>
        </div>
    );
}
