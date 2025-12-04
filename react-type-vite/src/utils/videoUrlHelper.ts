/**
 * Helper để xử lý video URL từ nhiều nguồn khác nhau
 * 
 * Support:
 * - YouTube (convert to embed URL)
 * - Cloudinary (fix /raw/ to /video/, add extension)
 * - Direct video files (.mp4, .webm, etc.)
 */

export const fixCloudinaryVideoUrl = (url: string): string => {
  if (!url) return url;

  let fixedUrl = url;

  // Check if it's a Cloudinary URL
  if (url.includes('cloudinary.com/')) {
    // Fix 1: Replace /raw/upload/ with /video/upload/
    if (url.includes('/raw/upload/')) {
      fixedUrl = url.replace('/raw/upload/', '/video/upload/');
      console.log('🔧 Fixed Cloudinary URL: /raw/ → /video/');
    }

    // Fix 2: Add video extension if missing
    const hasVideoExtension = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv|m4v)$/i.test(fixedUrl);
    if (!hasVideoExtension) {
      // Check if there's a version number at the end (v1234567890)
      const versionMatch = fixedUrl.match(/(\/v\d+\/)([^/.]+)$/);
      if (versionMatch) {
        // Add .mp4 after the filename
        fixedUrl = fixedUrl + '.mp4';
        console.log('🔧 Added .mp4 extension to Cloudinary URL');
      }
    }
  }

  if (fixedUrl !== url) {
    console.log('Original URL:', url);
    console.log('Fixed URL:', fixedUrl);
  }

  return fixedUrl;
};

/**
 * Check if URL is YouTube
 */
export const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.test(url);
};

/**
 * Extract YouTube video ID from URL
 */
export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  // Pattern để extract YouTube video ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,           // https://www.youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/embed\/)([^?&\s]+)/,            // https://www.youtube.com/embed/VIDEO_ID
    /(?:youtu\.be\/)([^?&\s]+)/,                       // https://youtu.be/VIDEO_ID
    /(?:youtube\.com\/v\/)([^?&\s]+)/,                 // https://www.youtube.com/v/VIDEO_ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      console.log('🎬 Extracted YouTube ID:', match[1]);
      return match[1];
    }
  }

  return null;
};

/**
 * Convert YouTube URL to embed URL
 */
export const getYouTubeEmbedUrl = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Get video format from URL
 */
export const getVideoFormat = (url: string): string => {
  const match = url.match(/\.([a-z0-9]+)(\?|$)/i);
  return match ? match[1].toLowerCase() : 'unknown';
};

/**
 * Check if URL is a valid video URL
 */
export const isValidVideoUrl = (url: string): boolean => {
  if (!url) return false;

  // Check common video patterns
  const videoPatterns = [
    /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv|m4v)(\?|$)/i,
    /cloudinary\.com.*\/video\//,
    /youtube\.com|youtu\.be/,
    /vimeo\.com/,
  ];

  return videoPatterns.some(pattern => pattern.test(url));
};

/**
 * Extract Cloudinary public ID from URL
 */
export const extractCloudinaryPublicId = (url: string): string | null => {
  if (!url.includes('cloudinary.com')) return null;

  // Pattern: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{ext}
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
};
