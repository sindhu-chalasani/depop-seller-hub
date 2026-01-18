import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { UploadCsv } from "../components/UploadCsv.tsx";
import { KpiCards } from "../components/KpiCards.tsx";

type Summary = {
    gmv_cents: number;
    profit_cents: number;
    units_sold: number;
    //add more fields
};

export default function Dashboard() {
    const [sellerUsername, setSellerUsername] = useState<string>("demo");
    const [kpis, setKpis] = useState<Summary | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    async function loadSummary(currentSellerUsername: string) {
        setError("");
        setLoading(true);
        setKpis(null);

        try {
        const data = await apiFetch(`/sellers/${currentSellerUsername}/summary`);
        setKpis(data as Summary);
        } catch (err: any) {
        setError(err.message ?? "Failed to load summary");
        } finally {
        setLoading(false);
        }
    }

    useEffect(() => {
        loadSummary(sellerUsername);
    }, []);

    return (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
            <h2 style={{ margin: 0 }}>MyDepop</h2>
            <p style={{ marginTop: 6, opacity: 0.75 }}>
                Upload a Depop sales CSV and view your KPIs.
            </p>
            </div>
        </div>

        <div
            style={{
            marginTop: 18,
            padding: 16,
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 12,
            }}
        >
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 14, opacity: 0.75 }}>Seller</label>
            <input
                value={sellerUsername}
                onChange={(e) => {
                    setSellerUsername(e.target.value);
                }}
                style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.18)",
                minWidth: 180,
                }}
            />

            <button
                onClick={() => loadSummary(sellerUsername)}
                style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.18)",
                background: "white",
                cursor: "pointer",
                }}
            >
                Refresh KPIs
            </button>
        </div>

        <div style={{ marginTop: 14 }}>
            <UploadCsv
                sellerUsername={sellerUsername}
                onUploaded={() => loadSummary(sellerUsername)}
            />
            </div>
        </div>

        <div style={{ marginTop: 18 }}>
            {loading && <p>Loading KPIs…</p>}
            {error && (
            <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
                {error}
            </p>
            )}
            {kpis && <KpiCards kpis={kpis} />}
        </div>
        </div>
    );
}