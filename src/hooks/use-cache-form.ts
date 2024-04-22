import { useCallback, useMemo, useRef } from "react";
import { FieldValues, UseFormGetValues, UseFormSetValue, UseFormStateReturn } from "react-hook-form";
import { useMount, useUnmount } from "react-use";
import { logger } from "../helpers/debug";
import { useTimeout } from "@chakra-ui/react";

// TODO: make these caches expire
export default function useCacheForm<TFieldValues extends FieldValues = FieldValues>(
  key: string | null,
  getValues: UseFormGetValues<TFieldValues>,
  setValue: UseFormSetValue<TFieldValues>,
  state: UseFormStateReturn<TFieldValues>,
) {
  const log = useMemo(() => (key ? logger.extend(`CachedForm:${key}`) : () => {}), [key]);
  const storageKey = key && "cached-form-" + key;

  useMount(() => {
    if (storageKey === null) return;
    try {
      const cached = localStorage.getItem(storageKey);
      localStorage.removeItem(storageKey);

      if (cached) {
        log("Restoring form");
        const values = JSON.parse(cached) as TFieldValues;
        for (const [key, value] of Object.entries(values)) {
          // @ts-ignore
          setValue(key, value, { shouldDirty: true });
        }
      }
    } catch (e) {}
  });

  const stateRef = useRef<UseFormStateReturn<TFieldValues>>(state);
  stateRef.current = state;
  useUnmount(() => {
    if (storageKey === null) return;
    if (!stateRef.current.isDirty) return;

    if (!stateRef.current.isSubmitted) {
      log("Saving form", getValues());
      localStorage.setItem(storageKey, JSON.stringify(getValues()));
    } else if (localStorage.getItem(storageKey)) {
      log("Removing cache because form was submitted");
      localStorage.removeItem(storageKey);
    }
  });

  const autoSave = useCallback(() => {
    if (storageKey === null) return;
    if (!stateRef.current.isSubmitted) {
      log("Autosave", getValues());
      localStorage.setItem(storageKey, JSON.stringify(getValues()));
    }
  }, [storageKey]);

  useTimeout(autoSave, 5_000);

  return useCallback(() => {
    if (storageKey === null) return;
    localStorage.removeItem(storageKey);
  }, [storageKey]);
}
