import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from "recharts";

type CategoryBreakdown = {
    category: string;
    revenue_cents: number;
    units_sold: number;
};

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"];

function formatDollars(cents: number) {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function CategoryChart({ data }: { data: CategoryBreakdown[] }) {
    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Sales by Category</h3>
                <p className="text-sm text-gray-400">No sales data yet.</p>
            </div>
        );
    }

    const chartData = data.map((d) => ({
        category: d.category,
        Revenue: d.revenue_cents / 100,
        units: d.units_sold,
    }));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Sales by Category</h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                        tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                        formatter={(value) => formatDollars(Number(value) * 100)}
                        contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
                    />
                    <Bar dataKey="Revenue" radius={[6, 6, 0, 0]}>
                        {chartData.map((_entry, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
