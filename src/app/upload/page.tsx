// FileManager.tsx - Main component
"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import UploadArea from "@/components/files/UploadArea";
import FilesList from "@/components/files/FilesList";

export default function FileManager() {
    const [files, setFiles] = useState<{ key: string; url: string }[]>([]);
    const [loadingList, setLoadingList] = useState(true);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        setLoadingList(true);
        try {
            const res = await fetch("/api/list");
            if (!res.ok) {
                throw new Error("Failed to fetch files");
            }
            const data = await res.json();
            setFiles(data);
        } catch {
            toast.error("Gagal mengambil daftar file");
        } finally {
            setLoadingList(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
                File Manager
            </h1>

            <UploadArea onUploadSuccess={fetchFiles} />

            <FilesList
                files={files}
                loadingList={loadingList}
                fetchFiles={fetchFiles}
            />
        </div>
    );
}