const SPECIAL_DOMAINS = ['youtube.com', 'twitch.tv', 'kick.com'];

/** Returns the full hostname from a URL string, or empty string on error. */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Returns true if the domain belongs to YouTube, Twitch, or Kick.
 * Handles subdomains like www.youtube.com.
 */
export function isSpecialDomain(domain: string): boolean {
  return SPECIAL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

/**
 * For YouTube, Twitch, and Kick URLs, extracts a normalized channel path.
 * YouTube: /@name, /channel/id, /c/name → returns as-is up to the channel segment.
 * Twitch:  /channelname (first path segment, not a known non-channel route).
 * Kick:    /channelname (first path segment).
 * Returns undefined for all other domains or unrecognized paths.
 */
export function extractChannelUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const { hostname, pathname } = parsed;

    if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
      // /@username, /channel/UC..., /c/name, /user/name
      const channelMatch = pathname.match(
        /^\/((?:@|channel\/|c\/|user\/)[^/?#]+)/,
      );
      if (channelMatch) return `/${channelMatch[1]}`;
      return undefined;
    }

    if (hostname === 'www.twitch.tv' || hostname === 'twitch.tv') {
      const NON_CHANNEL_TWITCH = new Set([
        '',
        'directory',
        'friends',
        'following',
        'settings',
        'wallet',
        'downloads',
        'subscriptions',
        'inventory',
        'drops',
        'bits',
        'prime',
        'payments',
        'moderator',
        'login',
        'signup',
        'p',
        'videos',
      ]);
      const seg = pathname.split('/')[1];
      if (seg && !NON_CHANNEL_TWITCH.has(seg)) return `/${seg}`;
      return undefined;
    }

    if (hostname === 'www.kick.com' || hostname === 'kick.com') {
      const NON_CHANNEL_KICK = new Set([
        '',
        'browse',
        'categories',
        'clips',
        'settings',
        'login',
        'signup',
        'your-channel',
        'gifts',
        'search',
      ]);
      const seg = pathname.split('/')[1];
      if (seg && !NON_CHANNEL_KICK.has(seg)) return `/${seg}`;
      return undefined;
    }

    return undefined;
  } catch {
    return undefined;
  }
}
