"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Debounced autosave: runs `save` once the user pauses for `delay` ms, and
 * exposes an `isSaving` flag for the save-status indicator. The `save` callback
 * owns its own error handling (toasts); this hook only sequences and debounces
 * it, and clears any pending timer on unmount.
 */
export function useDebouncedAutosave<T>(
  save: (value: T) => Promise<void>,
  delay = 1000,
) {
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep the latest save closure without resubscribing schedulers/timers.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const schedule = useCallback(
    (value: T) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await saveRef.current(value);
        } finally {
          setIsSaving(false);
        }
      }, delay);
    },
    [delay],
  );

  // Cleanup pending timer on unmount
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return { isSaving, schedule };
}
