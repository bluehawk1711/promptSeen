/**
 * Cloudinary image upload pipeline.
 *
 * Full pipeline: validate → compress → upload → return result.
 * Images are optimized client-side before hitting Cloudinary to minimize
 * bandwidth and ensure consistent card dimensions across the app.
 */

import type { CloudinaryUploadResult } from './types.js';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Target dimensions for prompt card images (4:5 portrait ratio). */
const TARGET_WIDTH = 1080;
const TARGET_HEIGHT = 1350;
const QUALITY = 82;

/** Accepted image MIME types. */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Max file size: 10MB before compression. */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ─── Validation ─────────────────────────────────────────────────────────────

export interface ValidationError {
  code: 'INVALID_TYPE' | 'TOO_LARGE' | 'INVALID_FILE';
  message: string;
}

/**
 * Validate an image file before processing.
 * Returns null if valid, or a ValidationError.
 */
export function validateImageFile(file: File): ValidationError | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      code: 'INVALID_TYPE',
      message: `Invalid file type "${file.type}". Accepted: JPEG, PNG, WebP, GIF.`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      code: 'TOO_LARGE',
      message: `File is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum is 10MB.`,
    };
  }
  return null;
}

// ─── Compression ────────────────────────────────────────────────────────────

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Output format. 'jpeg' is default for smallest size. */
  outputFormat?: 'jpeg' | 'webp' | 'png';
}

export interface CompressResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress and resize an image using the Canvas API.
 *
 * Pipeline:
 * 1. Load image into an offscreen Image element
 * 2. Calculate scaled dimensions (fit within target, preserve aspect ratio)
 * 3. Draw onto a Canvas at the target size
 * 4. Export as compressed Blob
 *
 * Returns metadata about the compression for UI feedback.
 */
export async function compressImage(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const {
    maxWidth = TARGET_WIDTH,
    maxHeight = TARGET_HEIGHT,
    quality = QUALITY,
    outputFormat = 'jpeg',
  } = options;

  // Server/SSR: return as-is
  if (typeof document === 'undefined') {
    return {
      blob: file,
      width: 0,
      height: 0,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  }

  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate scaled dimensions to fit within max bounds
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2D context'));
        return;
      }

      // High-quality downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType =
        outputFormat === 'png'
          ? 'image/png'
          : outputFormat === 'webp'
          ? 'image/webp'
          : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob returned null'));
            return;
          }

          resolve({
            blob,
            width,
            height,
            originalSize,
            compressedSize: blob.size,
            compressionRatio: blob.size / originalSize,
          });
        },
        mimeType,
        quality / 100
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
}

// ─── Upload ─────────────────────────────────────────────────────────────────

export interface UploadProgress {
  /** Bytes uploaded so far. */
  loaded: number;
  /** Total bytes to upload. */
  total: number;
  /** Percentage 0–100. */
  percent: number;
}

export interface UploadOptions {
  cloudName: string;
  uploadPreset: string;
  folder?: string;
  /** Cloudinary resource type. Use 'video' for video files. Defaults to 'image'. */
  resourceType?: 'image' | 'video';
  /** Called periodically during upload. */
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Upload a blob to Cloudinary via the unsigned upload endpoint.
 *
 * Uses XMLHttpRequest instead of fetch so we can track upload progress.
 * fetch() doesn't support upload progress events in browsers.
 */
export function uploadToCloudinary(
  blob: Blob,
  options: UploadOptions
): Promise<CloudinaryUploadResult> {
  const {
    cloudName,
    uploadPreset,
    folder = 'prompts',
    resourceType = 'image',
    onProgress,
  } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid JSON response from Cloudinary'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
    );
    xhr.send(formData);
  });
}

// ─── Full Pipeline ──────────────────────────────────────────────────────────

export interface PipelineResult {
  /** Cloudinary upload result. */
  upload: CloudinaryUploadResult;
  /** Compression metadata. */
  compression: CompressResult;
}

/**
 * Full upload pipeline: validate → compress → upload.
 *
 * This is the main entry point for the admin image upload flow.
 * Returns both the Cloudinary result and compression stats.
 */
export async function uploadImagePipeline(
  file: File,
  options: UploadOptions & CompressOptions,
  onStage?: (stage: 'validating' | 'compressing' | 'uploading') => void
): Promise<PipelineResult> {
  // Stage 1: Validate
  onStage?.('validating');
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  // Stage 2: Compress
  onStage?.('compressing');
  const compression = await compressImage(file, options);

  // Stage 3: Upload
  onStage?.('uploading');
  const upload = await uploadToCloudinary(compression.blob, options);

  return { upload, compression };
}

// ─── URL Generation ─────────────────────────────────────────────────────────

/**
 * Generate a Cloudinary URL with transformations.
 *
 * Useful for displaying images at specific sizes in the admin panel
 * or generating thumbnails.
 */
export function getCloudinaryUrl(
  publicId: string,
  cloudName: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
  } = {}
): string {
  const { width, height, quality = 'auto', format = 'auto' } = options;

  const parts = [`f_${format}`, `q_${quality}`];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (width && height) parts.push('c_fill');

  const transformation = parts.join(',');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
}
