import dayjs from "dayjs";
import _throttle from "lodash.throttle";

import Subject from "../classes/subject";
import SuperMap from "../classes/super-map";
import db from "./db";
import { logger } from "../helpers/debug";

class ReadStatusService {
  log = logger.extend("ReadStatusService");
  status = new SuperMap<string, Subject<boolean>>(() => new Subject());
  ttl = new Map<string, number>();

  private setTTL(key: string, ttl: number) {
    const current = this.ttl.get(key);
    if (!current || ttl > current) {
      this.ttl.set(key, ttl);
    }
  }

  getStatus(key: string, ttl?: number) {
    const subject = this.status.get(key);

    if (ttl) this.setTTL(key, ttl);
    else this.setTTL(key, dayjs().add(1, "day").unix());

    if (subject.value === undefined && !this.queue.has(key)) {
      this.queue.add(key);
      this.throttleRead();
    }

    return subject;
  }

  setRead(key: string, read = true, ttl?: number) {
    if (ttl) this.setTTL(key, ttl);
    else this.setTTL(key, dayjs().add(1, "day").unix());

    this.status.get(key).next(read);
    this.throttleWrite();
  }

  queue = new Set<string>();
  private throttleRead = _throttle(this.read.bind(this), 1000);
  async read() {
    if (this.queue.size === 0) return;

    const trans = db.transaction("read");

    this.log(`Loading ${this.queue.size} from database`);

    await Promise.all(
      Array.from(this.queue).map(async (key) => {
        const subject = this.status.get(key);
        const status = await trans.store.get(key);
        if (status) {
          subject.next(status.read);
          if (status.ttl) this.setTTL(key, status.ttl);
        } else subject.next(false);
      }),
    );
    this.queue.clear();
  }

  throttleWrite = _throttle(this.write.bind(this), 1000);
  async write() {
    const trans = db.transaction("read", "readwrite");

    let count = 0;
    const defaultTTL = dayjs().add(1, "day").unix();
    for (const [key, subject] of this.status) {
      if (subject.value !== undefined) {
        trans.store.add({ key, read: subject.value, ttl: this.ttl.get(key) ?? defaultTTL });
        count++;
      }
    }

    await trans.done;

    this.log(`Wrote ${count} to database`);
  }

  async prune() {
    const expired = await db.getAllKeysFromIndex("read", "ttl", IDBKeyRange.lowerBound(dayjs().unix(), true));

    if (expired.length === 0) return;

    const tx = db.transaction("read", "readwrite");
    await Promise.all(expired.map((key) => tx.store.delete(key)));
    await tx.done;

    this.log(`Removed ${expired.length} expired entries`);
  }
}

const readStatusService = new ReadStatusService();

setInterval(readStatusService.write.bind(readStatusService), 10_000);
setInterval(readStatusService.prune.bind(readStatusService), 30_000);

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.readStatusService = readStatusService;
}

export default readStatusService;
