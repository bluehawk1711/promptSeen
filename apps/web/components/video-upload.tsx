"use client";

/**
 * Admin video picker for prompts.
 *
 * Three modes:
 * - None     — the prompt stays image-only
 * - Upload   — pick a file, it is uploaded to Cloudinary immediately (with
 *              progress) so the saved prompt only stores the delivery URL
 * - YouTube  — paste a link; the video id is parsed and validated live
 *
 * The parent form only stores a `PromptVideo | null`, so this component owns
 * every upload detail (progress, validation, preview, cleanup).
 */

import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Link2,
  Loader2,
  MonitorPlay,
  Play,
  Trash2,
  Upload,
  Video as VideoIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  VIDEO_ACCEPT_ATTRIBUTE,
  VIDEO_HINT,
  createYouTubeVideo,
  formatVideoDuration,
  parseYouTubeId,
  uploadVideoPipeline,
} from "@repo/shared/video";
import type { UploadProgress } from "@repo/shared/cloudinary";
import type { PromptVideo } from "@repo/shared/types";

type VideoMode = "none" | "upload" | "youtube";

type UploadStage = "idle" | "uploading" | "done" | "error";

interface VideoUploadProps {
  /** Current video on the form. */
  value: PromptVideo | null;
  /** Called whenever the video changes (upload finished, link validated, removed). */
  onChange: (video: PromptVideo | null) => void;
  /**
   * `publicId` of the video already stored on the prompt. Used to avoid
   * deleting a live Cloudinary asset when the admin only removes it locally —
   * the parent deletes it after a successful save instead.
   */
  savedPublicId?: string;
  cloudName: string;
  uploadPreset: string;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export function VideoUpload({
  value,
  onChange,
  savedPublicId = "",
  cloudName,
  uploadPreset,
  disabled = false,
  onError,
}: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<VideoMode>(value ? value.type : "none");
  const [linkInput, setLinkInput] = useState(
    value?.type === "youtube" ? value.url : ""
  );
  const [stage, setStage] = useState<UploadStage>(value ? "done" : "idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [durationLabel, setDurationLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  /** Parsed id for the link currently typed in YouTube mode. */
  const youtubeId = mode === "youtube" ? parseYouTubeId(linkInput) : null;
  const linkIsInvalid =
    mode === "youtube" && linkInput.trim().length > 0 && !youtubeId;

  /** Delete a Cloudinary video that nothing references yet. */
  const discardUploadedVideo = useCallback(
    (publicId: string) => {
      if (!publicId || publicId === savedPublicId) return;

      void fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId, resourceType: "video" }),
      }).catch(() => {
        console.warn("Failed to clean up discarded video from Cloudinary");
      });
    },
    [savedPublicId]
  );

  /** Remove the current video from the form. */
  const handleRemove = useCallback(() => {
    if (value?.type === "upload") discardUploadedVideo(value.publicId);

    onChange(null);
    setStage("idle");
    setUploadProgress(0);
    setDurationLabel("");
    setErrorMsg(null);
    setLinkInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [value, onChange, discardUploadedVideo]);

  const handleModeChange = useCallback(
    (next: VideoMode) => {
      if (next === mode || disabled) return;
      setErrorMsg(null);

      // Leaving upload mode discards whatever is on the form.
      if (mode === "upload" && value?.type === "upload") {
        discardUploadedVideo(value.publicId);
        onChange(null);
        setStage("idle");
        setDurationLabel("");
      }

      if (mode === "youtube") {
        setLinkInput("");
        onChange(null);
      }

      setMode(next);
    },
    [mode, disabled, value, onChange, discardUploadedVideo]
  );

  const handleLinkChange = useCallback(
    (input: string) => {
      setLinkInput(input);
      setErrorMsg(null);

      if (!input.trim()) {
        onChange(null);
        return;
      }

      const video = createYouTubeVideo(input);
      onChange(video);
      if (!video) {
        setErrorMsg(
          "That does not look like a YouTube link. Try youtube.com/watch?v=… or youtu.be/…"
        );
      }
    },
    [onChange]
  );
const processFile = useCallback(
    async (file: File) => {
      setErrorMsg(null);

      if (!cloudName || !uploadPreset) {
        const msg =
          "Cloudinary not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env";
        setStage("error");
        setErrorMsg(msg);
        onError?.(msg);
        return;
      }

      // Replacing an existing upload — drop the previous session upload.
      if (value?.type === "upload") discardUploadedVideo(value.publicId);

      try {
        setStage("uploading");
        setUploadProgress(0);
        setDurationLabel("");

        const { video, upload } = await uploadVideoPipeline(file, {
          cloudName,
          uploadPreset,
          onProgress: (progress: UploadProgress) => {
            setUploadProgress(progress.percent);
          },
        });

        setStage("done");
        setDurationLabel(formatVideoDuration(upload.duration ?? 0));
        setErrorMsg(null);
        onChange(video);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Video upload failed";
        setStage("error");
        setErrorMsg(message);
        onError?.(message);
      }
    },
    [cloudName, uploadPreset, value, onChange, onError, discardUploadedVideo]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "none" ? "default" : "outline"}
          onClick={() => handleModeChange("none")}
          disabled={disabled}
          className="cursor-pointer"
        >
          <VideoIcon size={14} className="mr-1.5" />
          No video
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "upload" ? "default" : "outline"}
          onClick={() => handleModeChange("upload")}
          disabled={disabled}
          className="cursor-pointer"
        >
          <Upload size={14} className="mr-1.5" />
          Upload video
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "youtube" ? "default" : "outline"}
          onClick={() => handleModeChange("youtube")}
          disabled={disabled}
          className="cursor-pointer"
        >
          <MonitorPlay size={14} className="mr-1.5" />
          YouTube link
        </Button>
      </div>

      {/* No video */}
      {mode === "none" && (
        <p className="text-xs text-muted-foreground">
          This prompt will show the image only.
        </p>
      )}

      {/* Upload mode */}
      {mode === "upload" && (
        <div className="flex flex-col gap-3">
          {value?.type === "upload" && value.url ? (
            <div className="flex flex-col gap-2">
              <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border bg-black">
                <video
                  src={value.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                  <CheckCircle2 size={12} /> Uploaded
                </span>
                {durationLabel && <span>{durationLabel}</span>}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="ml-auto h-7 cursor-pointer"
                  onClick={handleRemove}
                  disabled={disabled}
                >
                  <Trash2 size={12} className="mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => !disabled && fileInputRef.current?.click()}
              className={`relative flex w-full max-w-sm flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-all duration-200 ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {stage === "uploading" ? (
                  <Loader2 size={18} className="animate-spin text-muted-foreground" />
                ) : (
                  <Play size={18} className="text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {stage === "uploading"
                    ? `Uploading… ${uploadProgress}%`
                    : isDragOver
                      ? "Drop video here"
                      : "Click or drag a video to upload"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{VIDEO_HINT}</p>
              </div>
              {stage === "uploading" && (
                <Progress value={uploadProgress} className="mt-1 h-1.5 w-full" />
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={VIDEO_ACCEPT_ATTRIBUTE}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />

          {stage === "error" && errorMsg && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle size={12} /> {errorMsg}
            </p>
          )}
        </div>
      )}

      {/* YouTube mode */}
      {mode === "youtube" && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Link2
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={linkInput}
              onChange={(e) => handleLinkChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className="pl-9"
              disabled={disabled}
            />
          </div>

          {youtubeId && (
            <div className="flex flex-col gap-2">
              <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border bg-black">
                {/* YouTube posters come from a remote host; a plain img is
                    simpler here than wiring another next/image loader. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                  alt="YouTube video preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 size={12} /> YouTube video detected — id {youtubeId}
              </p>
            </div>
          )}

          {linkIsInvalid && errorMsg && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle size={12} /> {errorMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}