import { BehaviorSubject } from "rxjs";
import { ReportResults } from "@satellite-earth/core/types";
import { NotificationChannel } from "@satellite-earth/core/types/control-api/notifications.js";

import Report from "./report";

export default class NotificationChannelsReport extends Report<"NOTIFICATION_CHANNELS"> {
  readonly type = "NOTIFICATION_CHANNELS";

  channels = new BehaviorSubject<Record<string, NotificationChannel> | undefined>(undefined);

  refresh() {
    this.channels.next({});
    this.fire();
  }
  handleResult(channel: ReportResults["NOTIFICATION_CHANNELS"]): void {
    if (Array.isArray(channel)) {
      const id = channel[1];

      const next = { ...this.channels.value };
      delete next[id];
      this.channels.next(next);
    } else
      this.channels.next({
        ...this.channels.value,
        [channel.id]: channel,
      });
  }
}
