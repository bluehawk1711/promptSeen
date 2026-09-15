import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

import {
  getPromptVideoThumbnail,
  getYouTubeEmbedUrl,
  hasPlayableVideo,
} from '@repo/shared/video';
import { Colors } from '@/theme/colors';
import type { PromptVideo } from '@repo/shared/types';

interface VideoPlayerProps {
  /** Video to play. */
  video: PromptVideo;
  /** Fallback poster when the video has no thumbnail of its own. */
  fallbackThumbnailUrl?: string;
  /** Width / height ratio of the player frame. Defaults to 16:9. */
  aspectRatio?: number;
}

/** Escape a value so it can be embedded in an HTML attribute. */
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * `baseUrl` for the local player page.
 *
 * A secure origin is required so the remote video is not treated as mixed
 * content. Derived from the video URL instead of hardcoding a host.
 */
function resolveBaseUrl(videoUrl: string): string {
  const match = videoUrl.match(/^https?:\/\/[^/]+/);
  return match ? match[0] : 'https://res.cloudinary.com';
}

/**
 * HTML page for an uploaded (Cloudinary) video.
 *
 * WebViews have no native player for a bare MP4 URL, so the file is wrapped in
 * an HTML5 `<video>` element — the underlying decoder is still the native one
 * (ExoPlayer / AVPlayer).
 */
function buildVideoHtml(video: PromptVideo, thumbnailUrl: string): string {
  const src = escapeAttribute(video.url);
  const poster = thumbnailUrl ? ` poster="${escapeAttribute(thumbnailUrl)}"` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #000; overflow: hidden; }
  video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000; }
</style>
</head>
<body>
<video src="${src}"${poster} controls playsinline webkit-playsinline preload="metadata"></video>
</body>
</html>`;
}
/**
 * Prompt video player.
 *
 * - `upload` videos stream from Cloudinary as MP4 (H.264)
 * - `youtube` videos use YouTube's own embed page
 *
 * Both run inside a WebView so the app keeps a single, dependency-light player
 * that behaves the same on iOS and Android. Inline and fullscreen playback are
 * enabled, and the platform's native media controls are used.
 */
export const VideoPlayer = memo(function VideoPlayer({
  video,
  fallbackThumbnailUrl = '',
  aspectRatio = 16 / 9,
}: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);

  const isYouTube = video.type === 'youtube';
  const thumbnailUrl = useMemo(
    () => getPromptVideoThumbnail(video, fallbackThumbnailUrl),
    [video, fallbackThumbnailUrl]
  );

  const source = useMemo(() => {
    if (isYouTube) {
      // YouTube's embed page handles inline playback and fullscreen itself.
      return { uri: getYouTubeEmbedUrl(video.youtubeId) };
    }

    return {
      html: buildVideoHtml(video, thumbnailUrl),
      baseUrl: resolveBaseUrl(video.url),
    };
  }, [isYouTube, video, thumbnailUrl]);

  const handleRetry = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setPlayerKey((key) => key + 1);
  }, []);

  if (!hasPlayableVideo(video)) {
    return (
      <View style={[styles.frame, { aspectRatio }]}>
        <View style={styles.stateWrap}>
          <AlertCircle size={22} color={Colors.dark.mutedForeground} />
          <Text style={styles.stateText}>Video unavailable</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.frame, { aspectRatio }]}>
      {failed ? (
        <View style={styles.stateWrap}>
          <AlertCircle size={22} color={Colors.dark.mutedForeground} />
          <Text style={styles.stateText}>Could not load the video</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <RefreshCw size={13} color="#FF7A2E" />
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          key={playerKey}
          source={source}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          scrollEnabled={false}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
          onHttpError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      )}

      {loading && !failed && (
        <View style={styles.loadingWrap} pointerEvents="none">
          <ActivityIndicator color="#FF7A2E" />
        </View>
      )}
    </View>
  );
});
const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,122,46,0.25)',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#150A00',
  },
  stateText: {
    color: Colors.dark.mutedForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,122,46,0.4)',
    backgroundColor: 'rgba(255,122,46,0.12)',
  },
  retryText: {
    color: '#FF7A2E',
    fontSize: 12,
    fontWeight: '700',
  },
});