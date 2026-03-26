import { describe, it, expect } from 'vitest';

import { extractDomain, isSpecialDomain, extractChannelUrl } from '../domain';

describe('extractDomain', () => {
  it('extracts hostname from a valid URL', () => {
    expect(extractDomain('https://www.youtube.com/watch?v=abc')).toBe(
      'www.youtube.com',
    );
  });

  it('returns empty string for invalid URL', () => {
    expect(extractDomain('not-a-url')).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(extractDomain('')).toBe('');
  });

  it('extracts hostname without www', () => {
    expect(extractDomain('https://twitch.tv/channel')).toBe('twitch.tv');
  });
});

describe('isSpecialDomain', () => {
  it.each([
    'youtube.com',
    'www.youtube.com',
    'twitch.tv',
    'www.twitch.tv',
    'kick.com',
    'www.kick.com',
  ])('returns true for %s', (domain) => {
    expect(isSpecialDomain(domain)).toBe(true);
  });

  it.each([
    'google.com',
    'example.com',
    'notyoutube.com',
    'twitch.tv.fake.com',
  ])('returns false for %s', (domain) => {
    expect(isSpecialDomain(domain)).toBe(false);
  });
});

describe('extractChannelUrl', () => {
  describe('YouTube', () => {
    it('extracts /@username channel', () => {
      expect(extractChannelUrl('https://www.youtube.com/@mkbhd')).toBe(
        '/@mkbhd',
      );
    });

    it('extracts /channel/ID', () => {
      expect(
        extractChannelUrl('https://www.youtube.com/channel/UC123abc'),
      ).toBe('/channel/UC123abc');
    });

    it('extracts /c/name', () => {
      expect(extractChannelUrl('https://www.youtube.com/c/myname')).toBe(
        '/c/myname',
      );
    });

    it('extracts /user/name', () => {
      expect(extractChannelUrl('https://www.youtube.com/user/someone')).toBe(
        '/user/someone',
      );
    });

    it('returns undefined for watch page without channel', () => {
      expect(
        extractChannelUrl('https://www.youtube.com/watch?v=abc123'),
      ).toBeUndefined();
    });

    it('returns undefined for YouTube homepage', () => {
      expect(extractChannelUrl('https://www.youtube.com/')).toBeUndefined();
    });
  });

  describe('Twitch', () => {
    it('extracts channel name', () => {
      expect(extractChannelUrl('https://www.twitch.tv/shroud')).toBe('/shroud');
    });

    it('returns undefined for known non-channel routes', () => {
      expect(
        extractChannelUrl('https://www.twitch.tv/directory'),
      ).toBeUndefined();
      expect(
        extractChannelUrl('https://www.twitch.tv/settings'),
      ).toBeUndefined();
    });

    it('returns undefined for Twitch homepage', () => {
      expect(extractChannelUrl('https://www.twitch.tv/')).toBeUndefined();
    });
  });

  describe('Kick', () => {
    it('extracts channel name', () => {
      expect(extractChannelUrl('https://kick.com/xqc')).toBe('/xqc');
    });

    it('returns undefined for known non-channel routes', () => {
      expect(extractChannelUrl('https://kick.com/browse')).toBeUndefined();
      expect(extractChannelUrl('https://kick.com/categories')).toBeUndefined();
    });

    it('returns undefined for Kick homepage', () => {
      expect(extractChannelUrl('https://kick.com/')).toBeUndefined();
    });
  });

  describe('Other domains', () => {
    it('returns undefined for non-special domains', () => {
      expect(
        extractChannelUrl('https://example.com/some/path'),
      ).toBeUndefined();
    });

    it('returns undefined for invalid URLs', () => {
      expect(extractChannelUrl('not-a-url')).toBeUndefined();
    });
  });
});
