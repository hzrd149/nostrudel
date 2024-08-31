import { useCallback, useEffect, useMemo, useRef } from "react";
import { FieldValues, UseFormGetValues, UseFormReset, UseFormStateReturn } from "react-hook-form";
import { useBeforeUnload } from "react-router-dom";

import { logger } from "../helpers/debug";

export default function useCacheForm<TFieldValues extends FieldValues = FieldValues>(
  key: string | null,
  getValues: UseFormGetValues<TFieldValues>,
  reset: UseFormReset<TFieldValues>,
  state: UseFormStateReturn<TFieldValues>,
  opts?: { clearOnKeyChange: boolean },
) {
  const log = useMemo(() => (key ? logger.extend(`CachedForm:${key}`) : () => {}), [key]);
  const storageKey = key && "cached-form-" + key;

  const stateRef = useRef<UseFormStateReturn<TFieldValues>>(state);
  stateRef.current = state;

  // NOTE: this watches the state
  state.isDirty;
  state.isSubmitted;

  useEffect(() => {
    if (!storageKey) return;

    // restore form on key change or mount
    try {
      const cached = localStorage.getItem(storageKey);

      // remove the item and keep it in memory
      localStorage.removeItem(storageKey);

      if (cached) {
        const values = JSON.parse(cached) as TFieldValues;

        log("Restoring form");
        reset(values, { keepDefaultValues: true });
      } else if (opts?.clearOnKeyChange) {
        log("Clearing form");
        reset();
      }
    } catch (e) {}

    // save previous key on change or unmount
    return () => {
      if (stateRef.current.isSubmitted) {
        log("Removing because submitted");
        localStorage.removeItem(storageKey);
      } else if (stateRef.current.isDirty) {
        const values = getValues();
        log("Saving form", values);
        localStorage.setItem(storageKey, JSON.stringify(values));
      }
    };
  }, [storageKey, log, opts?.clearOnKeyChange]);

  const saveOnClose = useCallback(() => {
    if (!storageKey) return;

    if (stateRef.current.isSubmitted) {
      log("Removing because submitted");
      localStorage.removeItem(storageKey);
    } else if (stateRef.current.isDirty) {
      const values = getValues();
      log("Saving form", values);
      localStorage.setItem(storageKey, JSON.stringify(values));
    }
  }, [log, getValues, storageKey]);

  useBeforeUnload(saveOnClose);

  return useCallback(() => {
    if (!storageKey) return;

    localStorage.removeItem(storageKey);
  }, [storageKey]);
}
