"use client";

import { useCallback, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  validateImageFile,
  compressImage,
  uploadToCloudinary,
  type UploadProgress,
  type CompressResult,
} from "@repo/shared/cloudinary";

interface ImageUploadProps {
  currentImageUrl?: string;
  currentPublicId?: string;
  onUploadComplete: (data: { imageUrl: string; publicId: string }) => void;
  onRemove?: () => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  cloudName: string;
  uploadPreset: string;
}

export interface ImageUploadHandle {
  upload: () => Promise<boolean>;
  hasPendingUpload: () => boolean;
}

type UploadStage = "idle" | "validating" | "compressing" | "compressed" | "uploading" | "done" | "error";

export const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(
  function ImageUpload(
    {
      currentImageUrl,
      currentPublicId,
      onUploadComplete,
      onRemove,
      onError,
      disabled = false,
      cloudName,
      uploadPreset,
    },
    ref
  ) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stage, setStage] = useState<UploadStage>(currentImageUrl ? "done" : "idle");
    const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null);
    const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
    const [compressionInfo, setCompressionInfo] = useState<CompressResult | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const upload = useCallback(async (): Promise<boolean> => {
      if (!compressedBlob) return true;
      if (!cloudName || !uploadPreset) {
        const msg = "Cloudinary not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env";
        setStage("error");
        setErrorMsg(msg);
        onError?.(msg);
        return false;
      }

      try {
        setStage("uploading");
        setUploadProgress(0);

        const result = await uploadToCloudinary(compressedBlob, {
          cloudName,
          uploadPreset,
          folder: "prompts",
          onProgress: (progress: UploadProgress) => {
            setUploadProgress(progress.percent);
          },
        });

        setStage("done");
        setPreview(result.secure_url);
        setCompressedBlob(null);
        onUploadComplete({
          imageUrl: result.secure_url,
          publicId: result.public_id,
        });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setStage("error");
        setErrorMsg(message);
        onError?.(message);
        return false;
      }
    }, [compressedBlob, cloudName, uploadPreset, onUploadComplete, onError]);

    useImperativeHandle(ref, () => ({
      upload,
      hasPendingUpload: () => compressedBlob !== null,
    }), [upload, compressedBlob]);

    const reset = useCallback(() => {
      setStage("idle");
      setPreview(currentImageUrl ?? null);
      setCompressedBlob(null);
      setCompressionInfo(null);
      setUploadProgress(0);
      setErrorMsg(null);
    }, [currentImageUrl]);

    const processFile = useCallback(
      async (file: File) => {
        setErrorMsg(null);

        setStage("validating");
        const validationError = validateImageFile(file);
        if (validationError) {
          setStage("error");
          setErrorMsg(validationError.message);
          onError?.(validationError.message);
          return;
        }

        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        try {
          setStage("compressing");
          const compression = await compressImage(file, {
            maxWidth: 1080,
            maxHeight: 1350,
            quality: 82,
            outputFormat: "jpeg",
          });
          setCompressionInfo(compression);
          setCompressedBlob(compression.blob);
          setStage("compressed");
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Compression failed";
          setStage("error");
          setErrorMsg(message);
          onError?.(message);
        }
      },
      [onError]
    );

    const handleFileSelect = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
      },
      [processFile]
    );

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
          processFile(file);
        }
      },
      [processFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
      setIsDragOver(false);
    }, []);

    const handleRemove = useCallback(() => {
      setPreview(null);
      setStage("idle");
      setCompressedBlob(null);
      setCompressionInfo(null);
      setUploadProgress(0);
      setErrorMsg(null);
      onRemove?.();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, [onRemove]);

    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const stageLabel: Record<UploadStage, string> = {
      idle: "Upload Image",
      validating: "Validating...",
      compressing: "Compressing...",
      compressed: "Ready to save",
      uploading: "Uploading...",
      done: "Upload Complete",
      error: "Upload Failed",
    };

    return (
      <div className="flex flex-col gap-3">
        {preview ? (
          <div className="relative group">
            <div className="relative aspect-[4/5] w-full max-w-[200px] overflow-hidden rounded-xl border">
              <Image
                src={preview}
                alt="Prompt image"
                fill
                className="object-cover"
                unoptimized
              />
              {!disabled && (stage === "idle" || stage === "compressed" || stage === "done") && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} className="mr-1" />
                    Replace
                  </Button>
                  {onRemove && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleRemove}
                    >
                      <X size={14} className="mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              )}
              {stage === "done" && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 size={24} className="text-green-500 drop-shadow-lg" />
                </div>
              )}
              {stage === "compressed" && (
                <div className="absolute top-2 right-2">
                  <div className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Ready
                  </div>
                </div>
              )}
            </div>

            {compressionInfo && (stage === "compressed" || stage === "done") && (
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{compressionInfo.width}x{compressionInfo.height}</span>
                <span>{formatBytes(compressionInfo.originalSize)} &rarr; {formatBytes(compressionInfo.compressedSize)}</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {Math.round((1 - compressionInfo.compressionRatio) * 100)}% smaller
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-3
              w-full max-w-[200px] aspect-[4/5] rounded-xl border-2 border-dashed
              cursor-pointer transition-all duration-200
              ${isDragOver
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ImageIcon size={20} className="text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragOver ? "Drop image here" : "Click or drag to upload"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP, or GIF (max 10MB)
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {stage === "uploading" && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Uploading to Cloudinary...</span>
              <span className="font-medium">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1.5" />
          </div>
        )}

        {stage === "compressing" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" />
            Compressing image for optimal quality...
          </div>
        )}

        {stage === "compressed" && (
          <div className="flex items-center gap-2 text-xs text-primary">
            <CheckCircle2 size={12} />
            Image ready — will upload when you save
          </div>
        )}

        {stage === "error" && errorMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle size={14} />
            {errorMsg}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 text-xs"
              onClick={reset}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    );
  }
);
