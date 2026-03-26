const SKIP_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'moz-extension://',
  'about:',
  'edge://',
];

function isInjectableUrl(url: string | undefined): boolean {
  if (!url) return false;
  return !SKIP_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export default defineBackground(() => {
  // Inject the content script into tabs that were already open when the
  // extension was installed or reloaded. New navigations are handled
  // automatically by the declarative content script registration.
  browser.runtime.onInstalled.addListener(async () => {
    const tabs = await browser.tabs.query({});
    await Promise.allSettled(
      tabs
        .filter((tab) => tab.id !== undefined && isInjectableUrl(tab.url))
        .map((tab) =>
          browser.scripting.executeScript({
            target: { tabId: tab.id! },
            files: ['/content-scripts/content.js'],
          }),
        ),
    );
  });
});
