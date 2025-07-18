import { Debugger } from "debug";
import { BehaviorSubject, filter, identity, interval, Observable, startWith, Subscription } from "rxjs";

import { logger } from "../helpers/debug";
import localSettings from "./preferences";
import { socialGraph$, updateSocialGraph } from "./social-graph";

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

export const updateSocialGraphCron = new CronTask("update-social-graph", () =>
  updateSocialGraph(localSettings.updateSocialGraphDistance.value),
);
updateSocialGraphCron.interval = localSettings.updateSocialGraphInterval;
updateSocialGraphCron.lastRun = localSettings.lastUpdatedSocialGraph;
updateSocialGraphCron.start();

// Trigger an update if there are no users in the 2nd degree
if (socialGraph$.value.getUsersByFollowDistance(2).size === 0) {
  updateSocialGraphCron.run();
}
