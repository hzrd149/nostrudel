import { useCallback, useRef } from "react";
import { FieldValues, UseFormGetValues, UseFormSetValue, UseFormStateReturn } from "react-hook-form";
import { useMount, useUnmount } from "react-use";

// TODO: make these caches expire
export default function useCacheForm<TFieldValues extends FieldValues = FieldValues>(
  key: string | null,
  getValues: UseFormGetValues<TFieldValues>,
  setValue: UseFormSetValue<TFieldValues>,
  state: UseFormStateReturn<TFieldValues>,
) {
  const storageKey = key && key + "-form-values";

  useMount(() => {
    if (storageKey === null) return;
    try {
      const cached = localStorage.getItem(storageKey);
      localStorage.removeItem(storageKey);

      if (cached) {
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
    if (stateRef.current.isDirty && !stateRef.current.isSubmitted) {
      localStorage.setItem(storageKey, JSON.stringify(getValues()));
    } else localStorage.removeItem(storageKey);
  });

  return useCallback(() => {
    if (storageKey === null) return;
    localStorage.removeItem(storageKey);
  }, [storageKey]);
}
