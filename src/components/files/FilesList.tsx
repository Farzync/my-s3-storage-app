
// FilesList.tsx - Component for displaying and managing files
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { File, Loader2, Copy, ExternalLink, Trash2, RefreshCw } from "lucide-react";
import { getFileExtension, getFileIconColor, getFileName } from "./utils";

interface FilesListProps {
    files: { key: string; url: string }[];
    loadingList: boolean;
    fetchFiles: () => void;
}

export default function FilesList({
    files,
    loadingList,
    fetchFiles,
}: FilesListProps) {
    const [loadingDelete, setLoadingDelete] = useState<{ [key: string]: boolean }>(
        {}
    );

    const deleteFile = async (key: string) => {
        if (!confirm("Yakin ingin menghapus file ini?")) return;

        setLoadingDelete((prev) => ({ ...prev, [key]: true }));
        try {
            const res = await fetch(`/api/delete?key=${encodeURIComponent(key)}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");

            toast.success("File berhasil dihapus!");
            fetchFiles();
        } catch {
            toast.error("Gagal menghapus file");
        } finally {
            setLoadingDelete((prev) => ({ ...prev, [key]: false }));
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success("URL disalin ke clipboard!");
    };

    return (
        <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Daftar File</h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchFiles}
                    disabled={loadingList}
                    className="flex items-center gap-2"
                >
                    {loadingList ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Refresh</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw size={16} />
                            <span>Refresh</span>
                        </>
                    )}
                </Button>
            </div>

            {loadingList ? (
                <div className="flex justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                </div>
            ) : files.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                    <File size={40} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-lg">Belum ada file yang diupload</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Upload file pertama Anda menggunakan form di atas
                    </p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                    {files.map((file) => {
                        const fileExt = getFileExtension(file.key);
                        const iconColor = getFileIconColor(fileExt);

                        return (
                            <div
                                key={file.key}
                                className="bg-white border rounded-lg p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div
                                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColor}`}
                                >
                                    <span className="uppercase text-xs font-bold">{fileExt}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p
                                        className="font-medium truncate"
                                        title={getFileName(file.key)}
                                    >
                                        {getFileName(file.key)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-gray-500 hover:text-blue-600 rounded-full w-8 h-8 p-0"
                                        onClick={() => copyToClipboard(file.url)}
                                        title="Copy URL"
                                    >
                                        <Copy size={16} />
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-gray-500 hover:text-purple-600 rounded-full w-8 h-8 p-0"
                                        onClick={() => window.open(file.url, "_blank")}
                                        title="Open File"
                                    >
                                        <ExternalLink size={16} />
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-gray-500 hover:text-red-600 rounded-full w-8 h-8 p-0"
                                        onClick={() => deleteFile(file.key)}
                                        disabled={loadingDelete[file.key]}
                                        title="Delete File"
                                    >
                                        {loadingDelete[file.key] ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

