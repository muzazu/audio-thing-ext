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
  // YouTube fires this custom event after every client-side navigation
  window.addEventListener('yt-navigate-finish', handleNavigation);

  return () => {
    window.removeEventListener('popstate', handleNavigation);
    window.removeEventListener('hashchange', handleNavigation);
    window.removeEventListener('yt-navigate-finish', handleNavigation);
  };
}
