/**
 * @repo/shared — Shared utilities, types, and Firebase logic for PromptGallery
 */

// ─── Types ──────────────────────────────────────────────────────────────────
export type {
   FirebaseConfig,
   EnvPrefix,
   Prompt,
   Category,
   CategoryCreateInput,
   UserProfile,
   CloudinaryConfig,
   CloudinaryUploadResult,
   BackupMetadata,
   BackupData,
   AdType,
   AdConfig,
   // Collections
   Collection,
   CollectionCreateInput,
   // Submissions
   PromptSubmission,
   SubmissionStatus,
   // Analytics
   AnalyticsEvent,
   AnalyticsEventType,
   DailyStats,
   // Notifications
   FCMToken,
   PushNotification,
   NotificationPreferences,
} from './types';

// ─── Config ─────────────────────────────────────────────────────────────────
export { loadFirebaseConfig } from './config';

// ─── Firebase ───────────────────────────────────────────────────────────────
export { initFirebase, type InitFirebaseOptions, type FirebaseServices } from './firebase';

// ─── Errors ─────────────────────────────────────────────────────────────────
export { messageFor } from './errors';

// ─── Theme ──────────────────────────────────────────────────────────────────
export {
   Colors,
   darkColors,
   lightColors,
   withOpacity,
   type ColorKeys,
   HEIGHT,
   FONT_SIZE,
   BORDER_RADIUS,
   CORNERS,
   SPACING,
} from './theme/index';

// ─── Cloudinary ─────────────────────────────────────────────────────────────
export {
   validateImageFile,
   compressImage,
   uploadToCloudinary,
   uploadImagePipeline,
   getCloudinaryUrl,
   type ValidationError,
   type CompressOptions,
   type CompressResult,
   type UploadProgress,
   type UploadOptions,
   type PipelineResult,
} from './cloudinary';

// ─── Daily Prompt ──────────────────────────────────────────────────────────
export {
   getDailyPrompt,
   getTodayKey,
   getTimeUntilRotation,
   formatTimeUntilRotation,
} from './daily-prompt';

// ─── Trending ─────────────────────────────────────────────────────────────
export {
   getTrendingScore,
   getTrendingPrompts,
   formatTrendingScore,
} from './trending';

// ─── Analytics ─────────────────────────────────────────────────────────────
export {
    logAnalyticsEvent,
    getTodayDateKey,
    getYesterdayDateKey,
    incrementDailyStat,
    trackActiveUser,
    getDailyStatsRange,
    getRecentEvents,
    getEngagementSummary,
    type LogEventOptions,
} from './analytics';

// ─── Backup ─────────────────────────────────────────────────────────────────
export {
    exportFirestoreData,
    downloadBackup,
    importFirestoreData,
    parseBackupFile,
} from './backup';
