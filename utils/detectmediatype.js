export const detectMediaType = (url) => {
  if (!url || typeof url !== 'string' || url.trim() === '') return 'none';

  const cleaned = url.trim().toLowerCase();

  // YouTube: standard watch, short youtu.be, shorts, embed
  const youtubePattern =
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)/;
  if (youtubePattern.test(cleaned)) return 'youtube';

  // Video file extensions
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  if (videoExtensions.some((ext) => cleaned.split('?')[0].endsWith(ext)))
    return 'video';

  // Image file extensions
  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.bmp',
    '.tiff',
  ];
  if (imageExtensions.some((ext) => cleaned.split('?')[0].endsWith(ext)))
    return 'image';

  // Google Drive image/video links
  if (cleaned.includes('drive.google.com')) {
    if (cleaned.includes('export=view') || cleaned.includes('/preview'))
      return 'image';
    return 'image'; // default drive links to image
  }

  // Imgur
  if (cleaned.includes('imgur.com')) return 'image';

  // Vimeo
  if (cleaned.includes('vimeo.com')) return 'video';

  // Cloudinary — check for video in URL
  if (cleaned.includes('cloudinary.com')) {
    return cleaned.includes('/video/') ? 'video' : 'image';
  }

  // Default: treat unknown URLs as images (can be changed)
  return 'image';
};

/**
 * Extract YouTube video ID from URL for embed
 */
 export const getYouTubeId = (url) => {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /\/shorts\/([^?]+)/,
    /\/embed\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};
