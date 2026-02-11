import { useRef, useState } from "react";
import { apiFetch } from "../api/client";

export function UploadCsv({
    sellerUsername,
    onUploaded,
}: {
    sellerUsername: string;
    onUploaded: () => void;
}) {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setMessage("");
        setIsError(false);
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
            setIsError(false);
            onUploaded();
        } catch (err: any) {
            setMessage(err.message ?? "Upload failed");
            setIsError(true);
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    return (
        <div>
            <div className="flex items-center gap-3 flex-wrap">
                <label
                    className={`inline-flex items-center gap-2 text-sm font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors ${
                        uploading
                            ? "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400"
                            : "cursor-pointer hover:bg-gray-50 text-gray-700"
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {uploading ? "Uploading..." : "Choose CSV file"}
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv"
                        onChange={handleUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
            </div>

            {message && (
                <p className={`mt-3 text-sm ${isError ? "text-red-600" : "text-green-600"}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
