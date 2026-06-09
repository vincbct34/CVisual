"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Interval-based autosave with a manual flush.
 *
 * `schedule(value)` records the latest editor state and marks it dirty, then —
 * unlike a debounce — arms a **fixed** timer that fires every `interval` ms
 * regardless of how fast edits keep coming. Each tick saves the latest unsaved
 * value; once there's nothing left to save the timer stops on its own. So a user
 * typing nonstop still gets a save roughly every `interval` ms (a guaranteed
 * max-wait), not only after they pause.
 *
 * `flush()` saves the latest unsaved value immediately (the manual "Save"
 * button). `isSaving` is the in-flight indicator; `isDirty` flips true on the
 * first edit (no wait) and drives the status label + beforeunload guard.
 *
 * The `save` callback owns its own error handling (toasts) and should re-throw
 * on failure so the value stays dirty and the next tick/flush retries.
 */
export function useAutosave<T>(
  save: (value: T) => Promise<void>,
  interval = 30_000,
) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const latestValueRef = useRef<T | null>(null);
  const savedValueRef = useRef<T | null>(null);
  const savingRef = useRef(false);
  // A flush/tick arrived while a save was in flight — re-run once it settles.
  const rerunPendingRef = useRef(false);
  // Stable self-reference so `run` can chain a follow-up save without a dep cycle.
  const runRef = useRef<(value: T) => Promise<void>>(async () => {});

  // Keep the latest save closure without resubscribing timers.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const run = useCallback(async (value: T) => {
    if (savingRef.current) {
      // A save is already running — don't overlap, but remember to save the
      // latest value as soon as the in-flight one settles (covers the manual
      // flush firing mid-save).
      rerunPendingRef.current = true;
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    try {
      await saveRef.current(value);
      savedValueRef.current = value;
      // Only clear dirty if nothing newer was scheduled mid-save.
      if (latestValueRef.current === value) setIsDirty(false);
    } catch {
      // Save failed (callback already surfaced it) — stay dirty so the change
      // isn't lost; the next tick / flush retries.
    } finally {
      savingRef.current = false;
      setIsSaving(false);
      // If a newer value landed (or a flush was requested) during the save and
      // the save succeeded, persist it now rather than waiting for the next tick.
      const requeued = rerunPendingRef.current;
      rerunPendingRef.current = false;
      if (requeued && latestValueRef.current !== savedValueRef.current) {
        void runRef.current(latestValueRef.current as T);
      }
    }
  }, []);
  useEffect(() => {
    runRef.current = run;
  }, [run]);

  // Periodic tick: save the latest unsaved value, or stop once clean.
  const tick = useCallback(() => {
    if (savingRef.current) return; // a save is already running; wait for it
    if (latestValueRef.current !== savedValueRef.current) {
      void run(latestValueRef.current as T);
    } else {
      stopTimer(); // nothing left to save
    }
  }, [run, stopTimer]);

  const schedule = useCallback(
    (value: T) => {
      latestValueRef.current = value;
      setIsDirty(true);
      if (!timerRef.current) timerRef.current = setInterval(tick, interval);
    },
    [interval, tick],
  );

  // Save the latest unsaved value right now (manual save button). If a save is
  // already in flight, `run` queues a follow-up so the click never no-ops.
  const flush = useCallback(() => {
    if (latestValueRef.current !== savedValueRef.current) {
      void run(latestValueRef.current as T);
    }
  }, [run]);

  // On unmount: stop the timer and fire a best-effort final save. Client-side
  // (SPA) navigation never triggers `beforeunload`, so without this the last
  // ≤interval ms of edits would be silently lost. State setters are skipped —
  // the component is gone — and the in-flight `fetch` outlives unmount.
  useEffect(() => {
    return () => {
      stopTimer();
      if (
        !savingRef.current &&
        latestValueRef.current !== savedValueRef.current
      ) {
        void saveRef.current(latestValueRef.current as T).catch(() => {});
      }
    };
  }, [stopTimer]);

  return { isSaving, isDirty, schedule, flush };
}
