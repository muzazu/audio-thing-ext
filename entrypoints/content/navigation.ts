import { applyStoredVolume } from './volume-applier';

type CleanupFn = () => void;

/**
 * Registers SPA navigation listeners that re-apply stored volume
 * on client-side route changes.
 *
 * Returns a cleanup function that removes all listeners.
 */
export function setupNavigationListeners(): CleanupFn {
  const handleNavigation = () => {
    applyStoredVolume(window.location.href);
  };

  window.addEventListener('popstate', handleNavigation);
  window.addEventListener('hashchange', handleNavigation);
  window.addEventListener('locationchange', handleNavigation);
  // YouTube fires this custom event after every client-side navigation
  window.addEventListener('yt-navigate-finish', handleNavigation);

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    window.dispatchEvent(new Event('locationchange'));
    return result;
  };
  history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    window.dispatchEvent(new Event('locationchange'));
    return result;
  };

  return () => {
    window.removeEventListener('popstate', handleNavigation);
    window.removeEventListener('hashchange', handleNavigation);
    window.removeEventListener('locationchange', handleNavigation);
    window.removeEventListener('yt-navigate-finish', handleNavigation);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
}
