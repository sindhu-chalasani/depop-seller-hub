function formatMoney(cents?: number | null) {
    if (cents == null) return "$0.00";
    const dollars = cents / 100;
    return `$${dollars.toFixed(2)}`;
}

function Card({ title, value }: { title: string; value: string }) {
    return (
        <div
        style={{
            padding: 16,
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 14,
            minWidth: 200,
        }}
        >
        <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>{title}</p>
        <p style={{ margin: "8px 0 0 0", fontSize: 22, fontWeight: 650 }}>{value}</p>
        </div>
  );
}

type Summary = {
    gmv_cents: number | null;
    profit_cents: number | null;
    units_sold: number;
};

export function KpiCards({ kpis }: { kpis: Summary }) {
    return (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Card title="GMV" value={formatMoney(kpis.gmv_cents)} />
        <Card title="Profit" value={formatMoney(kpis.profit_cents)} />
        <Card title="Units Sold" value={String(kpis.units_sold)} />
        </div>
    );
}