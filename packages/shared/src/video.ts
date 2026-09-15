/**
 * Prompt video support — validation, YouTube parsing, Cloudinary delivery URLs
 * and the video upload pipeline.
 *
 * A prompt video comes from one of two sources:
 *
 * 1. `upload`  — a video file stored on Cloudinary, delivered as MP4
 * 2. `youtube` — a YouTube link, played as an embed in a WebView
 *
 * This module is shared by the admin panel (picking/uploading the video) and
 * the mobile app (resolving playback + poster URLs) so both stay in sync.
 */

import type { CloudinaryUploadResult, PromptVideo } from './types.js';
import {
  uploadToCloudinary,
  type UploadOptions,
  type ValidationError,
} from './cloudinary';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Cloudinary folder uploaded prompt videos live in. */
export const VIDEO_FOLDER = 'prompts/videos';

/** `accept` attribute for video file inputs. */
export const VIDEO_ACCEPT_ATTRIBUTE = 'video/mp4,video/quicktime,video/webm,video/x-m4v';

/** Human-readable summary of what the picker accepts. */
export const VIDEO_HINT = 'MP4, MOV, or WebM — up to 100MB';

/** Accepted video MIME types. */
const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
];

/** Max video file size — Cloudinary's free-plan upload ceiling. */
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

/** YouTube ids are always exactly 11 URL-safe characters. */
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/** Matches `youtube.com/watch?v=`, `/embed/`, `/shorts/`, `/live/` and `/v/`. */
const YOUTUBE_PATH_PATTERN =
  /(?:youtube\.com|youtube-nocookie\.com)\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)([A-Za-z0-9_-]{11})/;

/** Matches `youtu.be/ID` short links. */
const YOUTUBE_SHORT_PATTERN = /youtu\.be\/([A-Za-z0-9_-]{11})/;

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Validate a video file before uploading.
 * Returns null when valid, or a `ValidationError` describing the problem.
 */
export function validateVideoFile(file: File): ValidationError | null {
  const isVideo =
    file.type.startsWith('video/') || ACCEPTED_VIDEO_TYPES.includes(file.type);

  if (!isVideo) {
    return {
      code: 'INVALID_TYPE',
      message: `Invalid file type "${file.type || 'unknown'}". Accepted: MP4, MOV, WebM.`,
    };
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return {
      code: 'TOO_LARGE',
      message: `Video is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum is ${
        MAX_VIDEO_SIZE / 1024 / 1024
      }MB.`,
    };
  }

  return null;
}

// ─── YouTube ────────────────────────────────────────────────────────────────

/**
 * Extract a YouTube video id from a link (or a bare id).
 *
 * Supported inputs: `youtube.com/watch?v=…`, `youtu.be/…`, `/shorts/…`,
 * `/embed/…`, `/live/…`, `/v/…`, `youtube-nocookie.com/…` and a raw 11-char id.
 *
 * Implemented with regexes only (no `URL` API) because React Native's URL
 * implementation is not reliable on every platform.
 */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (YOUTUBE_ID_PATTERN.test(value)) return value;

  const match = value.match(YOUTUBE_PATH_PATTERN) ?? value.match(YOUTUBE_SHORT_PATTERN);
  return match ? match[1] : null;
}

/** Embeddable player URL for a YouTube video id. */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1`;
}
// ── Cloudinary delivery URLs ───────────────────────────────────────────────

/**
 * MP4 delivery URL for an uploaded video.
 *
 * Forces `vc_h264` + `q_auto:good` so files recorded as MOV/HEVC still play in
 * every browser/WebView (Cloudinary transcodes and caches on first request).
 */
export function getCloudinaryVideoUrl(cloudName: string, publicId: string): string {
  return `https://res.cloudinary.com/${cloudName}/video/upload/q_auto:good,vc_h264/${publicId}.mp4`;
}

/** Poster frame (first frame, 4:5 card ratio) for an uploaded video. */
export function getCloudinaryVideoThumbnailUrl(
  cloudName: string,
  publicId: string
): string {
  return `https://res.cloudinary.com/${cloudName}/video/upload/w_1080,h_1350,c_fill,q_auto/${publicId}.jpg`;
}

// ─── Builders ───────────────────────────────────────────────────────────────

/** Build the stored video record for a YouTube link. Returns null when invalid. */
export function createYouTubeVideo(link: string): PromptVideo | null {
  const videoId = parseYouTubeId(link);
  if (!videoId) return null;

  return {
    type: 'youtube',
    url: link.trim(),
    publicId: '',
    youtubeId: videoId,
    thumbnailUrl: getYouTubeThumbnailUrl(videoId),
  };
}

/** Build the stored video record for a freshly uploaded Cloudinary video. */
export function createUploadedVideo(
  cloudName: string,
  upload: CloudinaryUploadResult
): PromptVideo {
  return {
    type: 'upload',
    url: getCloudinaryVideoUrl(cloudName, upload.public_id),
    publicId: upload.public_id,
    youtubeId: '',
    thumbnailUrl: getCloudinaryVideoThumbnailUrl(cloudName, upload.public_id),
  };
}

/** Poster image for a YouTube video id (`hqdefault` always exists). */
export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
// ── Read-time helpers ──────────────────────────────────────────────────────

/**
 * Poster image for a prompt video, falling back to the prompt image.
 * Always returns something safe to render.
 */
export function getPromptVideoThumbnail(
  video: PromptVideo,
  fallbackUrl = ''
): string {
  if (video.thumbnailUrl) return video.thumbnailUrl;

  if (video.type === 'youtube' && video.youtubeId) {
    return getYouTubeThumbnailUrl(video.youtubeId);
  }

  return fallbackUrl;
}

/** Type guard for video data read back from Firestore. */
export function isPromptVideo(value: unknown): value is PromptVideo {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  if (candidate.type !== 'upload' && candidate.type !== 'youtube') return false;

  return typeof candidate.url === 'string' && candidate.url.length > 0;
}

/** Whether a prompt actually has something playable attached. */
export function hasPlayableVideo(
  video: PromptVideo | null | undefined
): video is PromptVideo {
  if (!video) return false;
  if (video.type === 'youtube') return YOUTUBE_ID_PATTERN.test(video.youtubeId);
  return Boolean(video.url);
}

/** Format a video duration (seconds) as `m:ss` or `h:mm:ss`. */
export function formatVideoDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
}

// ─── Upload pipeline ────────────────────────────────────────────────────────

export interface VideoUploadResult {
  /** Stored video record, ready to save on the prompt. */
  video: PromptVideo;
  /** Raw Cloudinary response (duration, size, …). */
  upload: CloudinaryUploadResult;
}

/**
 * Validate and upload a video file to Cloudinary (unsigned).
 *
 * Videos are never re-encoded in the browser — Cloudinary applies the delivery
 * transforms (`vc_h264`, `q_auto`) so the file plays everywhere.
 */
export async function uploadVideoPipeline(
  file: File,
  options: UploadOptions
): Promise<VideoUploadResult> {
  const validationError = validateVideoFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  const upload = await uploadToCloudinary(file, {
    ...options,
    folder: options.folder ?? VIDEO_FOLDER,
    resourceType: 'video',
  });

  return {
    video: createUploadedVideo(options.cloudName, upload),
    upload,
  };
}