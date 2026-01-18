import { useState } from "react";
import { apiFetch } from "../api/client";

export function UploadCsv({
    sellerUsername,
    onUploaded,
}: {
    sellerUsername: string;
    onUploaded: () => void;
}) {
    const [uploading, setUploading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setMessage("");
        setUploading(true);

        try {
        const formData = new FormData();
        formData.append("seller_username", sellerUsername);
        formData.append("file", file);

        await apiFetch("/sellers/upload-sales", {
            method: "POST",
            body: formData,
        });

        setMessage("Upload complete");
        onUploaded();
        } catch (err: any) {
        setMessage(err.message ?? "Upload failed");
        } finally {
        setUploading(false);
        e.target.value = "";
        }
    }

    return (
        <div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input type="file" accept=".csv" onChange={handleUpload} disabled={uploading} />
            {uploading && <span>Uploading…</span>}
        </div>
        {message && <p style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{message}</p>}
        </div>
    );
}
