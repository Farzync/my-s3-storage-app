// utils.ts - Utility functions used across components
export const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  else if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  else return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatUploadSpeed = (bytesPerSecond: number) => {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(1)} B/s`;
  else if (bytesPerSecond < 1024 * 1024)
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  else return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
};

export const getFileExtension = (filename: string) => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

export const getFileName = (path: string) => {
  return path.split("/").pop() || path;
};

export const getFileIconColor = (extension: string) => {
  const typeMap: { [key: string]: string } = {
    pdf: "bg-red-100 text-red-600",
    doc: "bg-blue-100 text-blue-600",
    docx: "bg-blue-100 text-blue-600",
    xls: "bg-green-100 text-green-600",
    xlsx: "bg-green-100 text-green-600",
    ppt: "bg-orange-100 text-orange-600",
    pptx: "bg-orange-100 text-orange-600",
    jpg: "bg-purple-100 text-purple-600",
    jpeg: "bg-purple-100 text-purple-600",
    png: "bg-purple-100 text-purple-600",
    gif: "bg-purple-100 text-purple-600",
    zip: "bg-yellow-100 text-yellow-600",
    rar: "bg-yellow-100 text-yellow-600",
    txt: "bg-gray-100 text-gray-600",
  };

  return typeMap[extension] || "bg-blue-100 text-blue-600";
};
