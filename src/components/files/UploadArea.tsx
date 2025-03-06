// UploadArea.tsx - Component for multi-file upload functionality
"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UploadCloud, Loader2, X, File } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatFileSize, formatUploadSpeed, getFileExtension, getFileIconColor } from "./utils";

interface UploadAreaProps {
    onUploadSuccess: () => void;
}

interface FileUploadStatus {
    file: File;
    progress: number;
    uploadedSize: number;
    speed: number;
    status: 'waiting' | 'uploading' | 'processing' | 'completed' | 'error';
    url?: string;
}

export default function UploadArea({ onUploadSuccess }: UploadAreaProps) {
    const [files, setFiles] = useState<FileUploadStatus[]>([]);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const uploadStartTimes = useRef<Map<string, number>>(new Map());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async () => {
        if (files.length === 0) return toast.error("Pilih file dulu!");
        if (files.every(f => f.status === 'completed')) return toast.info("Semua file sudah diupload!");

        setLoading(true);

        // Reset progress for files that are not completed
        setFiles(prev => prev.map(fileStatus =>
            fileStatus.status !== 'completed' ?
                { ...fileStatus, progress: 0, uploadedSize: 0, speed: 0, status: 'waiting' } :
                fileStatus
        ));

        // Upload files sequentially to avoid overwhelming the server
        for (let i = 0; i < files.length; i++) {
            const fileStatus = files[i];

            // Skip already completed uploads
            if (fileStatus.status === 'completed') continue;

            // Set current file to uploading
            setFiles(prev => {
                const newFiles = [...prev];
                newFiles[i] = { ...newFiles[i], status: 'uploading' };
                return newFiles;
            });

            uploadStartTimes.current.set(fileStatus.file.name, Date.now());

            try {
                await uploadFile(fileStatus.file, i);
            } catch (error) {
                console.error("Error uploading file:", error);
                setFiles(prev => {
                    const newFiles = [...prev];
                    newFiles[i] = { ...newFiles[i], status: 'error' };
                    return newFiles;
                });
            }
        }

        setLoading(false);

        // Check if all files were uploaded successfully
        const allCompleted = files.every(f => f.status === 'completed');
        if (allCompleted) {
            toast.success("Semua file berhasil diupload!");
            onUploadSuccess();
        }
    };

    const uploadFile = (file: File, fileIndex: number): Promise<void> => {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", file);

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    // Calculate progress percentage
                    const percentage = Math.round((event.loaded / event.total) * 100);

                    // Calculate upload speed (bytes per second)
                    const startTime = uploadStartTimes.current.get(file.name) || Date.now();
                    const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
                    const speed = event.loaded / elapsedTime; // bytes per second

                    setFiles(prev => {
                        const newFiles = [...prev];
                        newFiles[fileIndex] = {
                            ...newFiles[fileIndex],
                            progress: percentage,
                            uploadedSize: event.loaded,
                            speed: speed,
                            status: percentage === 100 ? 'processing' : 'uploading'
                        };
                        return newFiles;
                    });
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Parse response to get URL
                    let url = '';
                    try {
                        const response = JSON.parse(xhr.responseText);
                        url = response.url || '';
                    } catch (e) {
                        console.error("Failed to parse response:", e);
                    }

                    setFiles(prev => {
                        const newFiles = [...prev];
                        newFiles[fileIndex] = {
                            ...newFiles[fileIndex],
                            status: 'completed',
                            url: url
                        };
                        return newFiles;
                    });

                    resolve();
                } else {
                    setFiles(prev => {
                        const newFiles = [...prev];
                        newFiles[fileIndex] = {
                            ...newFiles[fileIndex],
                            status: 'error'
                        };
                        return newFiles;
                    });

                    reject(new Error("Upload failed"));
                }
            });

            xhr.addEventListener("error", () => {
                setFiles(prev => {
                    const newFiles = [...prev];
                    newFiles[fileIndex] = {
                        ...newFiles[fileIndex],
                        status: 'error'
                    };
                    return newFiles;
                });

                reject(new Error("Upload failed"));
            });

            xhr.open("POST", "/api/upload");
            xhr.send(formData);
        });
    };

    // Handle drag events
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Convert FileList to Array and add to files state
            const newFiles = Array.from(e.dataTransfer.files).map(file => ({
                file,
                progress: 0,
                uploadedSize: 0,
                speed: 0,
                status: 'waiting' as const
            }));

            addFiles(newFiles);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                progress: 0,
                uploadedSize: 0,
                speed: 0,
                status: 'waiting' as const
            }));

            addFiles(newFiles);

            // Reset the input to allow selecting the same files again
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const addFiles = (newFiles: FileUploadStatus[]) => {
        setFiles(prevFiles => {
            // Filter out duplicate files based on name and size
            const uniqueNewFiles = newFiles.filter(
                newFile => !prevFiles.some(
                    existingFile =>
                        existingFile.file.name === newFile.file.name &&
                        existingFile.file.size === newFile.file.size
                )
            );

            return [...prevFiles, ...uniqueNewFiles];
        });
    };

    const removeFile = (index: number) => {
        setFiles(prevFiles => {
            const updatedFiles = [...prevFiles];
            updatedFiles.splice(index, 1);
            return updatedFiles;
        });
    };

    const removeAllFiles = () => {
        // Only remove files that are not currently uploading
        setFiles(prevFiles => prevFiles.filter(file => file.status === 'uploading'));
    };

    const getTotalProgress = () => {
        if (files.length === 0) return 0;

        const totalProgress = files.reduce((sum, file) => sum + file.progress, 0);
        return Math.round(totalProgress / files.length);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'error': return 'text-red-600';
            case 'processing': return 'text-blue-600';
            case 'uploading': return 'text-blue-600';
            default: return 'text-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'waiting': return 'Menunggu';
            case 'uploading': return 'Uploading';
            case 'processing': return 'Processing';
            case 'completed': return 'Selesai';
            case 'error': return 'Gagal';
            default: return 'Menunggu';
        }
    };

    return (
        <div
            className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
                }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
        >
            <UploadCloud size={48} className="mx-auto mb-4 text-gray-400" />

            <p className="mb-4 text-gray-600">Drag & drop files atau pilih files</p>

            <div className="relative">
                <Input
                    ref={fileInputRef}
                    type="file"
                    id="file-upload"
                    onChange={handleFileInputChange}
                    multiple
                    className="mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </div>

            {files.length > 0 && (
                <div className="mt-4 border rounded-lg divide-y">
                    <div className="bg-gray-50 p-3 rounded-t-lg flex justify-between items-center">
                        <span className="font-medium">{files.length} file(s) selected</span>
                        {files.some(f => f.status !== 'uploading' && f.status !== 'processing') && (
                            <Button
                                onClick={removeAllFiles}
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                                <X size={16} className="mr-1" /> Clear
                            </Button>
                        )}
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {files.map((fileStatus, index) => (
                            <div key={index} className="p-3 flex items-center gap-3 bg-white">
                                <div
                                    className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${getFileIconColor(
                                        getFileExtension(fileStatus.file.name)
                                    )}`}
                                >
                                    <span className="uppercase text-xs font-bold">
                                        {getFileExtension(fileStatus.file.name)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{fileStatus.file.name}</p>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>{formatFileSize(fileStatus.file.size)}</span>
                                        <span className={getStatusColor(fileStatus.status)}>
                                            {getStatusText(fileStatus.status)}
                                        </span>
                                    </div>

                                    {(fileStatus.status === 'uploading' || fileStatus.status === 'processing') && (
                                        <div className="mt-1">
                                            <Progress value={fileStatus.progress} className="h-1" />
                                            <div className="flex justify-between text-xs mt-1">
                                                <span>{fileStatus.progress}%</span>
                                                {fileStatus.status === 'uploading' && (
                                                    <span>{formatUploadSpeed(fileStatus.speed)}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {fileStatus.status !== 'uploading' && fileStatus.status !== 'processing' && (
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                                        title="Remove file"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {loading && (
                        <div className="p-3 bg-gray-50">
                            <div className="flex justify-between text-sm text-gray-500 mb-1">
                                <span>Total Progress</span>
                                <span>{getTotalProgress()}%</span>
                            </div>
                            <Progress value={getTotalProgress()} className="h-2" />
                        </div>
                    )}
                </div>
            )}

            <Button
                onClick={handleUpload}
                disabled={loading || files.length === 0 || files.every(f => f.status === 'completed')}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
                {loading ? (
                    <>
                        <Loader2 size={18} className="animate-spin mr-2" />
                        Uploading Files...
                    </>
                ) : (
                    <>
                        <UploadCloud size={18} className="mr-2" />
                        Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}
                    </>
                )}
            </Button>
        </div>
    );
}