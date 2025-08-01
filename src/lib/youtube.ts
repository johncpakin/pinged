// Create this file at: src/lib/youtube.ts

export function isYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;
  return youtubeRegex.test(url);
}

export function extractYouTubeVideoId(url: string): string | null {
  // Handle different YouTube URL formats
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,           // youtube.com/watch?v=VIDEO_ID
    /youtube\.com\/embed\/([^?]+)/,             // youtube.com/embed/VIDEO_ID
    /youtube\.com\/v\/([^?]+)/,                 // youtube.com/v/VIDEO_ID
    /youtu\.be\/([^?]+)/,                       // youtu.be/VIDEO_ID
    /youtube\.com\/shorts\/([^?]+)/,            // youtube.com/shorts/VIDEO_ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

export function isYouTubeShorts(url: string): boolean {
  return url.includes('/shorts/') || url.includes('youtube.com/shorts');
}