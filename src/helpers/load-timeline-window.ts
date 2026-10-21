import { TimelineLoader, TimelineStatus, TimelineWindow } from "applesauce-loaders/loaders";
import { NostrEvent } from "nostr-tools";
import {
  asapScheduler,
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  merge,
  Observable,
  observeOn,
  Subscription,
} from "rxjs";

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

/** Combines loaders into one that loads the same windows from each and reports all of their statuses */
export function mergeTimelineLoaders(loaders: TimelineLoader[]): TimelineLoader {
  const loader = (windows: TimelineWindow | Observable<TimelineWindow>) => merge(...loaders.map((l) => l(windows)));
  loader.status$ = combineLatest(loaders.map((l) => l.status$)).pipe(map((all) => all.flat()));
  return loader;
}

/** Checks that every source has finished loading the window that starts at since */
function isTimelineSettled(statuses: TimelineStatus[], since: number) {
  return statuses.length > 0 && statuses.every((s) => s.window.since === since && s.state !== "loading");
}

/** Doubles the active window each time it finishes loading while the end of the list is on screen */
export function loadTimelineWhileVisible(loader: TimelineLoader, end$: Observable<boolean>): Observable<NostrEvent> {
  return new Observable((observer) => {
    const window = getWindow(loader);
    const subscriptions = new Subscription();
    subscriptions.add(loader(window).subscribe(observer));
    subscriptions.add(
      combineLatest([loader.status$, window, end$])
        .pipe(
          filter(([statuses, { since }, end]) => end && since > 0 && isTimelineSettled(statuses, since)),
          // Leave the status emission before feeding a new window back into the loader
          observeOn(asapScheduler),
        )
        .subscribe(([, { since, until }]) => {
          if (window.value.since === since) window.next({ since: Math.max(0, until - (until - since) * 2), until });
        }),
    );
    return subscriptions;
  });
}
