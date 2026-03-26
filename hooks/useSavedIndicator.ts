import * as React from 'react';

/**
 * Manages a "Saved!" indicator that auto-resets after a delay.
 * Cleans up the timeout on unmount to prevent setState on unmounted components.
 */
export function useSavedIndicator(delay = 1500) {
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), delay);
    return () => clearTimeout(timer);
  }, [saved, delay]);

  const markSaved = React.useCallback(() => setSaved(true), []);

  return { saved, markSaved } as const;
}
