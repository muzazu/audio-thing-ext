import { waitForElement } from '@/lib/utils';

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

/**
 * Extracts the channel URL from the page DOM for special domains.
 * Uses a MutationObserver to wait for the relevant element to appear,
 * so callers do not need an external timeout.
 */
export const extractChannelFromDOM = async (): Promise<string | undefined> => {
  const { hostname } = window.location;

  if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
    const selectors = [
      '#upload-info yt-formatted-string.ytd-channel-name a',
      '#metapanel a',
    ];

    const links = await Promise.allSettled(
      // works fine with 4g network latency, so no need for a longer timeout
      // maybe consider adding a short delay between attempts if this becomes an issue in the future
      selectors.map((sel) => waitForElement(sel, 0)),
    );
    const link = links.filter(
      (res): res is PromiseFulfilledResult<HTMLAnchorElement> =>
        res.status === 'fulfilled' && res.value instanceof HTMLAnchorElement,
    )[0]?.value;

    if (!link) return undefined;

    let href = link.getAttribute('href') ?? '';
    try {
      // Normalize absolute URLs to pathnames (handles full https://youtube.com/@name links)
      if (/^https?:\/\//.test(href)) href = new URL(href).pathname;
    } catch {
      // ignore parsing errors and keep original href
    }

    const match = href.match(/^\/(?:@|channel\/|c\/)[^/?#]+/);
    return match ? `${match[0]}` : undefined;
  }

  if (hostname === 'www.twitch.tv' || hostname === 'twitch.tv') {
    // works fine with 4g network latency, so no need for a longer timeout
    // maybe consider adding a short delay between attempts if this becomes an issue in the future
    const h1 = await waitForElement<HTMLHeadingElement>('h1', 0);

    const seg = h1?.textContent?.trim().toLowerCase();

    if (seg) return `/${seg}`;
    return undefined;
  }

  // Kick: channel is always the first path segment — already handled by extractChannelUrl
  return undefined;
};
