import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type MonthlySales = {
    month: string;
    revenue_cents: number;
    profit_cents: number;
    units_sold: number;
};

function formatDollars(cents: number) {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatMonth(month: string) {
    const [year, m] = month.split("-");
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${names[parseInt(m, 10) - 1]} ${year.slice(2)}`;
}

export function RevenueChart({ data }: { data: MonthlySales[] }) {
    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Revenue Over Time</h3>
                <p className="text-sm text-gray-400">No sales data yet.</p>
            </div>
        );
    }

    const chartData = data.map((d) => ({
        month: formatMonth(d.month),
        Revenue: d.revenue_cents / 100,
        Profit: d.profit_cents / 100,
    }));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                        tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                        formatter={(value) => formatDollars(Number(value) * 100)}
                        contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Area
                        type="monotone"
                        dataKey="Revenue"
                        stroke="#ef4444"
                        fill="#fee2e2"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="Profit"
                        stroke="#22c55e"
                        fill="#dcfce7"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
