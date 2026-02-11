function formatMoney(cents?: number | null) {
    if (cents == null) return "$0.00";
    const dollars = cents / 100;
    return `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Card({ title, value }: { title: string; value: string }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}

export type Summary = {
    gmv_cents: number;
    profit_cents: number;
    total_fees_cents: number;
    units_sold: number;
    avg_sale_price_cents: number;
    listed_count: number;
    sell_through_rate: number;
    avg_days_to_sell: number;
    active_listings: number;
};

export function KpiCards({ kpis }: { kpis: Summary }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card title="GMV" value={formatMoney(kpis.gmv_cents)} />
            <Card title="Profit" value={formatMoney(kpis.profit_cents)} />
            <Card title="Units Sold" value={String(kpis.units_sold)} />
            <Card title="Avg Sale Price" value={formatMoney(kpis.avg_sale_price_cents)} />
            <Card title="Avg Days to Sell" value={kpis.avg_days_to_sell > 0 ? `${kpis.avg_days_to_sell.toFixed(1)}d` : "—"} />
            <Card title="Sell-Through" value={`${(kpis.sell_through_rate * 100).toFixed(0)}%`} />
        </div>
    );
}
