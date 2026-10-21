import { safeParse } from "applesauce-core/helpers/json";
import { use$ } from "applesauce-react/hooks";
import { useCallback } from "react";
import { BehaviorSubject, fromEvent, filter } from "rxjs";

const subjects = new Map<string, BehaviorSubject<string[]>>();

function read(storageKey: string): string[] {
  const value = localStorage.getItem(storageKey);
  const parsed = value ? safeParse<string[]>(value) : undefined;
  return Array.isArray(parsed) ? parsed : [];
}

/** One shared subject per key so every hook instance (and other tabs) see updates */
function getRecent$(storageKey: string) {
  let subject = subjects.get(storageKey);
  if (!subject) {
    const created = new BehaviorSubject(read(storageKey));
    fromEvent<StorageEvent>(window, "storage")
      .pipe(filter((e) => e.key === storageKey))
      .subscribe(() => created.next(read(storageKey)));
    subjects.set(storageKey, created);
    subject = created;
  }
  return subject;
}

export default function useRecentIds(key: string, maxLength?: number) {
  const storageKey = "recent-" + key;
  const recent$ = getRecent$(storageKey);
  const recent = use$(recent$);

  const useThing = useCallback(
    (app: string) => {
      const next = [app, ...recent$.value.filter((a) => a !== app)];
      const trimmed = maxLength ? next.slice(0, maxLength) : next;
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
      recent$.next(trimmed);
    },
    [recent$, storageKey, maxLength],
  );

  return { recent, useThing };
}
