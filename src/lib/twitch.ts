// Twitch URL detection and parsing utilities

export function isTwitchUrl(url: string): boolean {
  const twitchRegex = /^(https?:\/\/)?(www\.)?(twitch\.tv|clips\.twitch\.tv)\//;
  return twitchRegex.test(url);
}

export function extractTwitchInfo(url: string): { type: 'clip' | 'video' | 'channel'; id: string } | null {
  // Handle Twitch clips
  const clipMatch = url.match(/clips\.twitch\.tv\/([^?\/]+)/);
  if (clipMatch) {
    return { type: 'clip', id: clipMatch[1] };
  }

  // Handle Twitch videos
  const videoMatch = url.match(/twitch\.tv\/videos\/([^?\/]+)/);
  if (videoMatch) {
    return { type: 'video', id: videoMatch[1] };
  }

  // Handle Twitch channels (live streams)
  const channelMatch = url.match(/twitch\.tv\/([^?\/]+)$/);
  if (channelMatch && channelMatch[1] !== 'videos') {
    return { type: 'channel', id: channelMatch[1] };
  }

  return null;
}

export function isTwitchClip(url: string): boolean {
  return url.includes('clips.twitch.tv');
}

export function isTwitchVideo(url: string): boolean {
  return url.includes('twitch.tv/videos/');
}

export function isTwitchChannel(url: string): boolean {
  const info = extractTwitchInfo(url);
  return info?.type === 'channel';
}