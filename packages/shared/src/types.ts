/**
 * Shared types for the TS Prompt monorepo.
 *
 * Both the React Native mobile app and the Next.js admin panel consume these.
 */

// ─── Firebase Config ────────────────────────────────────────────────────────

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type EnvPrefix = 'EXPO_PUBLIC_' | 'NEXT_PUBLIC_';

// ─── Prompt ─────────────────────────────────────────────────────────────────

export interface Prompt {
  id: string;
  /** The prompt text the user can copy. */
  text: string;
  /** Optimized image URL from Cloudinary. */
  imageUrl: string;
  /** Cloudinary public_id for management (delete, transform). */
  cloudinaryPublicId: string;
  /** References to the categories this prompt belongs to. */
  categoryIds: string[];
  /** Display order within the category. */
  order: number;
  /** Number of times this prompt has been liked. */
  likesCount: number;
  /** Number of times this prompt has been copied. */
  copiesCount: number;
  /** Number of times this prompt has been shared. */
  shareCount: number;
  /** Tags for search and filtering. Stored as lowercase tokens. */
  tags: string[];
  /** Whether this prompt is visible in the app. */
  isActive: boolean;
  /** Whether this prompt is locked behind a reward ad. */
  isPremium: boolean;
  /**
   * Optional video shown on the prompt detail screen.
   *
   * Missing/`null` means the prompt is image-only. Prompts stay image-first —
   * `imageUrl` is the poster, the video plays on demand.
   */
  video?: PromptVideo | null;
  /** Creation timestamp (ms since epoch). */
  createdAt: number | null;
  /** Last update timestamp (ms since epoch). */
  updatedAt: number | null;
}

// ─── Prompt video ───────────────────────────────────────────────────────────

/** How a prompt's video is delivered to the app. */
export type PromptVideoType = 'upload' | 'youtube';

/**
 * Optional video attached to a prompt.
 *
 * Two sources are supported:
 *
 * 1. `upload`  — a file uploaded to Cloudinary, delivered as MP4
 * 2. `youtube` — a YouTube link saved by an admin, played as an embed
 *
 * `thumbnailUrl` is always populated so the app can show a poster frame
 * without loading a player.
 */
export interface PromptVideo {
  /** Where the video comes from. */
  type: PromptVideoType;
  /**
   * Playable URL.
   * - `upload`: Cloudinary MP4 delivery URL
   * - `youtube`: the original YouTube link
   */
  url: string;
  /** Cloudinary `public_id` of the uploaded video. Empty for YouTube. */
  publicId: string;
  /** YouTube video ID. Empty for uploads. */
  youtubeId: string;
  /** Poster frame shown before playback. */
  thumbnailUrl: string;
}

// ─── Category ──────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  /** Display name (e.g., "Marketing", "Creative Writing"). */
  name: string;
  /** URL-safe slug for routing (e.g., "marketing"). */
  slug: string;
  /** Emoji or icon identifier. */
  icon: string;
  /** Hex color for the category badge. */
  color: string;
  /** Display order. */
  order: number;
  /** Number of active prompts in this category (denormalized). */
  promptCount: number;
  /** Whether this category is visible. */
  isActive: boolean;
  createdAt: number | null;
}

export type CategoryCreateInput = Omit<Category, 'id' | 'promptCount' | 'createdAt'>;

// ─── User / Auth ────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  /** Whether this user has admin privileges. */
  isAdmin: boolean;
  createdAt: number | null;
}

// ─── Cloudinary ─────────────────────────────────────────────────────────────

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  /** Resource type Cloudinary stored the asset as. Video uploads return 'video'. */
  resource_type?: 'image' | 'video' | 'raw';
  /** Duration in seconds — only present for video uploads. */
  duration?: number;
}

// ─── Backup ─────────────────────────────────────────────────────────────────

export interface BackupMetadata {
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Number of documents per collection. */
  counts: Record<string, number>;
  /** Which collections were included. */
  collections: string[];
}

export interface BackupData {
  metadata: BackupMetadata;
  prompts: Prompt[];
  categories: Category[];
  users: UserProfile[];
  userCollections: Collection[];
  submissions: PromptSubmission[];
  /** Analytics events (optional — excluded by default for size). */
  analyticsEvents?: AnalyticsEvent[];
  /** Daily aggregated stats (optional). */
  dailyStats?: DailyStats[];
  /** FCM device tokens (optional — excluded by default for privacy). */
  fcmTokens?: FCMToken[];
  /** Push notification history (optional). */
  pushNotifications?: PushNotification[];
  /** App settings (optional). */
  settings?: Record<string, unknown>[];
}

// ─── Collections ───────────────────────────────────────────────────────────

export interface Collection {
  id: string;
  /** Owner's Firebase Auth UID. */
  ownerId: string;
  /** Display name (e.g., "My Marketing Prompts"). */
  name: string;
  /** Optional description. */
  description: string;
  /** Hex color for the collection badge. */
  color: string;
  /** Emoji icon. */
  icon: string;
  /** IDs of prompts in this collection. */
  promptIds: string[];
  /** Number of prompts (denormalized). */
  promptCount: number;
  /** Whether this collection is visible to others. */
  isPublic: boolean;
  /** Number of times this collection has been liked. */
  likesCount: number;
  /** Number of times this collection has been duplicated by other users. */
  duplicatesCount: number;
  createdAt: number | null;
  updatedAt: number | null;
}

export type CollectionCreateInput = Omit<Collection, 'id' | 'promptCount' | 'likesCount' | 'duplicatesCount' | 'createdAt' | 'updatedAt'>;

// ─── User-Submitted Prompts ─────────────────────────────────────────────────

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface PromptSubmission {
  id: string;
  /** UID of the user who submitted this. */
  submitterUid: string;
  /** Display name of the submitter. */
  submitterName: string;
  /** The prompt text submitted. */
  text: string;
  /** Optional image URL (user can attach an image). */
  imageUrl: string;
  /** Suggested category ID. */
  suggestedCategoryId: string;
  /** Tags suggested by the submitter. */
  tags: string[];
  /** Admin review status. */
  status: SubmissionStatus;
  /** Admin review notes (shown to the submitter on rejection). */
  reviewNote: string;
  /** UID of the admin who reviewed this. */
  reviewedBy: string | null;
  /** Timestamp of admin review. */
  reviewedAt: number | null;
  /** If approved, the ID of the prompt created from this submission. */
  approvedPromptId: string | null;
  createdAt: number | null;
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'prompt_view'
  | 'prompt_like'
  | 'prompt_unlike'
  | 'prompt_copy'
  | 'prompt_share'
  | 'prompt_video_play'
  | 'prompt_premium_unlock'
  | 'collection_create'
  | 'collection_view'
  | 'collection_prompt_add'
  | 'collection_prompt_remove'
  | 'submission_create'
  | 'ad_banner_impression'
  | 'ad_reward_request'
  | 'ad_reward_complete'
  | 'app_open'
  | 'app_background'
  | 'screen_view'
  | 'search'
  | 'category_filter'
  | 'ad_impression'
  | 'premium_unlock'
  | 'notification_received'
  | 'notification_opened';

export interface AnalyticsEvent {
  id: string;
  /** Type of event. */
  type: AnalyticsEventType;
  /** UID of the user (anonymous for non-auth users). */
  userId: string;
  /** Associated prompt ID, if any. */
  promptId?: string;
  /** Associated collection ID, if any. */
  collectionId?: string;
  /** Additional metadata. */
  metadata?: Record<string, string | number | boolean>;
  /** Platform: 'ios', 'android', 'web'. */
  platform: string;
  /** App version. */
  appVersion: string;
  createdAt: number;
}

/** Aggregated daily stats — one document per day. */
export interface DailyStats {
  id: string;
  /** Date key YYYY-MM-DD. */
  date: string;
  /** Unique active users. */
  activeUsers: number;
  /** Total prompt views. */
  promptViews: number;
  /** Total likes. */
  likes: number;
  /** Total copies. */
  copies: number;
  /** Total shares. */
  shares: number;
  /** Total ad impressions. */
  adImpressions: number;
  /** Total reward ad completions. */
  rewardCompletes: number;
  /** Total submissions. */
  submissions: number;
  /** New users. */
  newUsers: number;
  /** Top prompt IDs by engagement. */
  topPromptIds: string[];
  /** Top category IDs by engagement. */
  topCategoryIds: string[];
  createdAt: number;
}

// ─── Ad Types ───────────────────────────────────────────────────────────────

export type AdType = 'banner' | 'reward';

export interface AdConfig {
  /** AdMob banner ad unit ID. */
  bannerAdUnitId: string;
  /** AdMob reward ad unit ID. */
  rewardAdUnitId: string;
}

// ─── Push Notifications ────────────────────────────────────────────────────

/** Stored FCM device token. */
export interface FCMToken {
  id: string;
  /** The FCM registration token. */
  token: string;
  /** User ID (optional — anonymous devices still get tokens). */
  userId: string | null;
  /** Platform: 'ios', 'android', 'web'. */
  platform: string;
  /** App version when token was registered. */
  appVersion: string;
  /** Whether this token is still active. */
  isActive: boolean;
  createdAt: number;
  lastSeenAt: number;
}

/** A sent push notification record. */
export interface PushNotification {
  id: string;
  /** Notification title. */
  title: string;
  /** Notification body. */
  body: string;
  /** Optional image URL. */
  imageUrl: string;
  /** Deep link path (e.g., '/prompt/abc123'). */
  data: Record<string, string>;
  /** Target: 'all' | 'topic' | 'token'. */
  target: 'all' | 'topic' | 'token';
  /** Topic name (if target is 'topic'). */
  topic: string;
  /** Specific token (if target is 'token'). */
  token: string;
  /** Number of devices this was sent to. */
  sentCount: number;
  /** Number of devices that received it. */
  deliveredCount: number;
  /** Number of devices that opened/tapped this notification. */
  openedCount: number;
  /** UID of the admin who sent this. */
  sentBy: string;
  /** 'manual' | 'auto' (sent on prompt upload). */
  source: 'manual' | 'auto';
  /** Associated prompt ID (if auto-sent). */
  promptId: string | null;
  createdAt: number;
}

/** Aggregated notification analytics over a date range. */
export interface NotificationAnalytics {
  /** Total notifications sent. */
  totalSent: number;
  /** Total delivered. */
  totalDelivered: number;
  /** Total opened/tapped. */
  totalOpened: number;
  /** Delivery rate (delivered / sent). */
  deliveryRate: number;
  /** Open rate (opened / delivered). */
  openRate: number;
  /** Per-notification breakdown. */
  notifications: PushNotification[];
  /** Daily breakdown for charts. */
  dailyBreakdown: NotificationDailyStats[];
  /** Breakdown by source (manual vs auto). */
  sourceBreakdown: { source: string; count: number; opened: number }[];
  /** Platform breakdown from FCM tokens. */
  platformBreakdown: { platform: string; count: number }[];
}

/** Daily notification stats for chart display. */
export interface NotificationDailyStats {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
}

/** Notification preferences for a device. */
export interface NotificationPreferences {
  /** Master toggle. */
  enabled: boolean;
  /** Receive new prompt notifications. */
  newPrompts: boolean;
  /** Receive daily prompt reminders. */
  dailyPrompt: boolean;
  /** Receive promotional notifications. */
  promotional: boolean;
}
