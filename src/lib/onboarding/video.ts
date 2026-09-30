/** Utilidades del vídeo de presentación (YouTube / Vimeo). */

const VIDEO_HOST_RE = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/;

export function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && VIDEO_HOST_RE.test(parsed.hostname);
  } catch {
    return false;
  }
}

/** URL de incrustación (`iframe`) o `null` si no se puede derivar. */
export function getVideoEmbedUrl(url: string): string | null {
  if (!isValidVideoUrl(url)) return null;
  const parsed = new URL(url);
  if (parsed.hostname.endsWith('youtube.com')) {
    const videoId = parsed.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : null;
  }
  if (parsed.hostname.endsWith('youtu.be')) {
    const videoId = parsed.pathname.slice(1);
    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : null;
  }
  const videoId = parsed.pathname.split('/').filter(Boolean)[0];
  return videoId ? `https://player.vimeo.com/video/${encodeURIComponent(videoId)}` : null;
}
