"use client";

import { useCallback, useState } from "react";
import { Upload, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export function DocumentUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  accept = ".pdf,.png,.jpg,.jpeg,.json,.doc,.docx",
  maxSizeMB = 10,
  disabled = false,
}: DocumentUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const maxSize = maxSizeMB * 1024 * 1024;

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (file.size > maxSize) {
        setError(`File too large. Maximum size is ${maxSizeMB}MB`);
        return;
      }

      onFileSelect(file);
    },
    [maxSize, maxSizeMB, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragActive(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  if (selectedFile) {
    return (
      <div className="border border-forge-copper/10 rounded-lg p-4 bg-forge-copper/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-forge-copper" />
            <div>
              <p className="font-medium text-sm text-forge-text-1 truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-forge-text-3">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={onFileRemove}
            className="p-1 hover:bg-forge-copper/5 rounded transition-colors"
            disabled={disabled}
            type="button"
          >
            <X className="h-4 w-4 text-forge-text-3 hover:text-forge-text-1" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-forge-copper bg-forge-copper/10"
            : "border-forge-copper/10 hover:border-forge-copper/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
          id="document-upload"
        />
        <label htmlFor="document-upload" className="cursor-pointer">
          <Upload className="h-10 w-10 mx-auto mb-4 text-forge-text-3" />
          {isDragActive ? (
            <p className="text-sm text-forge-copper">Drop the file here...</p>
          ) : (
            <div>
              <p className="text-sm font-medium text-forge-text-1">
                Drag & drop a file here, or click to select
              </p>
              <p className="text-xs text-forge-text-3 mt-1">
                PDF, images, or documents up to {maxSizeMB}MB
              </p>
            </div>
          )}
        </label>
      </div>
      {error && <p className="text-sm text-forge-danger mt-2">{error}</p>}
    </div>
  );
}
