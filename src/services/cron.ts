import { Debugger } from "debug";
import { BehaviorSubject, filter, interval, Observable, startWith, Subscription } from "rxjs";

import { CAP_IS_WEB } from "../env";
import { logger } from "../helpers/debug";
import localSettings from "./preferences";
import { socialGraph$, startSocialGraphSync, stopSocialGraphSync, sync$, syncState$ } from "./social-graph";

export class CronTask {
  log: Debugger;
  interval = new BehaviorSubject<number>(0);
  lastRun = new BehaviorSubject<number>(0);

  running = new BehaviorSubject<boolean>(false);
  status = new BehaviorSubject<string>("");
  private timer: Subscription | null = null;
  private active: Subscription | null = null;

  constructor(
    private readonly name: string,
    private readonly task: () => Observable<string>,
  ) {
    this.log = logger.extend(`Task:${name}`);
  }

  // Run the cron task
  run() {
    if (this.running.value) return;

    this.log(`Running task ${this.name}`);
    this.lastRun.next(Date.now());
    this.running.next(true);

    this.active = this.task().subscribe({
      next: (status) => this.status.next(status),
      complete: () => {
        this.running.next(false);
        this.lastRun.next(Date.now());
        this.log(`Task ${this.name} completed`);
      },
    });
  }

  cancel() {
    this.log(`Cancelling task ${this.name}`);
    this.running.next(false);
    this.active?.unsubscribe();
    this.active = null;
  }

  // Start the cron task
  start() {
    this.timer = interval(60_000)
      .pipe(
        startWith(0),
        filter(() => {
          const now = Date.now();
          const interval = this.interval.value;
          const lastRun = this.lastRun.value;

          if (now - lastRun < interval) return false;
          return true;
        }),
      )
      .subscribe(() => this.run());
  }

  // Stop the cron task
  stop() {
    this.timer?.unsubscribe();
  }
}

/** Drives the social graph sync as an `Observable<string>` so it can be plugged into a `CronTask`. */
function syncSocialGraphTask(): Observable<string> {
  return new Observable<string>((subscriber) => {
    const stateSub = syncState$.subscribe((state) => {
      if (state) subscriber.next(`Loaded ${state.loaded} follow events`);
    });
    const syncSub = sync$.subscribe((active) => {
      if (active === null) subscriber.complete();
    });

    // Use the previous successful run as the `since` window so each cron run only fetches new follow lists.
    const lastRunMs = localSettings.lastUpdatedSocialGraph.value;
    const since = lastRunMs > 0 ? Math.floor(lastRunMs / 1000) : undefined;

    startSocialGraphSync({
      distance: localSettings.updateSocialGraphDistance.value,
      since,
    });

    return () => {
      stateSub.unsubscribe();
      syncSub.unsubscribe();
      stopSocialGraphSync();
    };
  });
}

export const updateSocialGraphCron = new CronTask("update-social-graph", syncSocialGraphTask);
updateSocialGraphCron.interval = localSettings.updateSocialGraphInterval;
updateSocialGraphCron.lastRun = localSettings.lastUpdatedSocialGraph;
updateSocialGraphCron.start();

// Trigger an update if there are no users in the 2nd degree
// NOTE: social graph is killing android for some reason (probably too much data in JS thread)
if (CAP_IS_WEB) {
  setTimeout(() => {
    if (socialGraph$.value.getUsersByFollowDistance(2).size === 0) {
      updateSocialGraphCron.run();
    }
  }, 10 * 1000);
}
