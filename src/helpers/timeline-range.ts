import { TimelineLoader, TimelineStatus, TimelineWindow } from "applesauce-loaders/loaders";
import {
  animationFrameScheduler,
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  ignoreElements,
  map,
  merge,
  Observable,
  observeOn,
  race,
  shareReplay,
  switchMap,
  take,
  tap,
  throttleTime,
  timer,
} from "rxjs";

const HOUR = 60 * 60;
const DAY = 24 * HOUR;
/** How far past the rendered range to load, doubled while extensions find few events */
export const RANGE_STEP = 6 * HOUR;
const MAX_STEP = 365 * DAY;
/** Extensions adding fewer events than this reach further next time */
const QUIET = 20;
/** Commit a window anyway if no source reports it loaded in time, so a feed with dead relays still renders */
const READY_TIMEOUT = 5000;

/** What the reader can see, reported by the timeline */
export type TimelineView = {
  /** The oldest created_at on screen */
  visibleSince?: number;
  /** Whether the end of the rendered list is near the viewport */
  bottomNear: boolean;
};

export type TimelineRange = {
  /** The time range rendered, it only grows once a source has loaded it */
  range$: BehaviorSubject<TimelineWindow>;
  view$: BehaviorSubject<TimelineView>;
  /** Reaches past the rendered range once, even when the end of the list is out of view */
  loadMore(): void;
  /** Feeds windows to the loader and grows the range while subscribed, emitting nothing */
  run(): Observable<never>;
};

/** Checks that at least one source has finished loading the visible part of a window */
export const isWindowReady = (window: TimelineWindow) => (statuses: TimelineStatus[]) =>
  statuses.some(
    (status) =>
      status.window.since === window.since &&
      status.window.until === Math.min(window.until, Math.floor(Date.now() / 1000)) &&
      status.state !== "loading",
  );

const ranges = new WeakMap<TimelineLoader, TimelineRange>();

/** Gets or creates the rendered range for a loader */
export function getTimelineRange(loader: TimelineLoader): TimelineRange {
  let range = ranges.get(loader);
  if (!range) {
    range = createTimelineRange(loader);
    ranges.set(loader, range);
  }
  return range;
}

/** Creates a range that grows past its oldest edge as the reader nears it, starting empty at now */
export function createTimelineRange(loader: TimelineLoader): TimelineRange {
  const head = Math.floor(Date.now() / 1000);
  const range$ = new BehaviorSubject<TimelineWindow>({ since: head, until: head });
  const view$ = new BehaviorSubject<TimelineView>({ bottomNear: false });
  const step$ = new BehaviorSubject(RANGE_STEP);
  const more$ = new BehaviorSubject(false);

  const run = () => {
    // Events the loader found below the range, counted when a commit covers them
    const pending = new Map<string, number>();

    const windows$ = combineLatest([view$, range$, step$, more$]).pipe(
      map(([view, range, step, more]) => {
        const reach = more || view.bottomNear || view.visibleSince === undefined;
        const since = reach ? Math.max(0, range.since - step) : Math.max(range.since, view.visibleSince!);
        return { since, until: head };
      }),
      distinctUntilChanged((a, b) => a.since === b.since && a.until === b.until),
      throttleTime(100, undefined, { leading: true, trailing: true }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    // Grow the range once the fastest source has loaded a window, never waiting on slow or offline relays
    const commits$ = windows$.pipe(
      switchMap((window) =>
        race(loader.status$.pipe(filter(isWindowReady(window))), timer(READY_TIMEOUT)).pipe(
          take(1),
          map(() => window),
        ),
      ),
      // Leave the status emission before changing the range, which feeds a new window back into the loader
      observeOn(animationFrameScheduler),
      tap((window) => {
        const range = range$.value;
        if (window.since >= range.since) return;

        let added = 0;
        for (const [id, created_at] of pending) {
          if (created_at < window.since) continue;
          added++;
          pending.delete(id);
        }

        // Quiet periods add few events, so reach further on the next extension
        step$.next(added < QUIET ? Math.min(step$.value * 2, MAX_STEP) : RANGE_STEP);
        more$.next(false);
        range$.next({ since: window.since, until: range.until });
      }),
    );

    const events$ = loader(windows$).pipe(
      tap((event) => {
        if (event.created_at < range$.value.since) pending.set(event.id, event.created_at);
      }),
    );

    return merge(events$, commits$).pipe(ignoreElements());
  };

  return {
    range$,
    view$,
    loadMore: () => more$.next(true),
    run,
  };
}
