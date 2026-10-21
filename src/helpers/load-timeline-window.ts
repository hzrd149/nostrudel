import { TimelineLoader, TimelineWindow } from "applesauce-loaders/loaders";
import { NostrEvent } from "nostr-tools";
import { BehaviorSubject, Observable, Subscription } from "rxjs";

const DAY = 86400;
const windows = new WeakMap<TimelineLoader, BehaviorSubject<TimelineWindow>>();

function getWindow(loader: TimelineLoader) {
  let window = windows.get(loader);
  if (!window) {
    const until = Math.floor(Date.now() / 1000);
    window = new BehaviorSubject({ since: until - DAY, until });
    windows.set(loader, window);
  }
  return window;
}

/** Widen the active timeline window by its current duration. */
export function loadMoreTimeline(loader: TimelineLoader) {
  const window = getWindow(loader);
  const { since, until } = window.value;
  window.next({ since: Math.max(0, since - (until - since)), until });
}

/** Own one finite window stream so scrolling preserves in-flight requests. */
export function loadTimelineWindow(loader: TimelineLoader, cursor$: Observable<number>): Observable<NostrEvent> {
  return new Observable((observer) => {
    const window = getWindow(loader);
    const subscriptions = new Subscription();
    subscriptions.add(loader(window).subscribe(observer));
    subscriptions.add(
      cursor$.subscribe({
        next: (cursor) => {
          const { since, until } = window.value;
          if (Number.isFinite(cursor) && cursor < since + DAY / 2 && since > 0) {
            window.next({ since: Math.max(0, Math.min(Math.floor(cursor) - DAY, since - DAY)), until });
          }
        },
        error: (error) => observer.error(error),
        complete: () => observer.complete(),
      }),
    );
    return subscriptions;
  });
}
