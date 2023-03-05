import moment from "moment";
import { SuperMap } from "../classes/super-map";
import db from "./db";

class RelayScoreboardService {
  private relays = new Set<string>();
  private relayResponseTimes = new SuperMap<string, [number, Date][]>(() => []);
  private relayDisconnects = new SuperMap<string, Date[]>(() => []);

  submitResponseTime(relay: string, time: number) {
    this.relays.add(relay);
    const arr = this.relayResponseTimes.get(relay);
    arr.unshift([time, new Date()]);
  }
  submitDisconnect(relay: string) {
    this.relays.add(relay);
    const arr = this.relayDisconnects.get(relay);
    arr.unshift(new Date());
  }

  pruneResponseTimes() {
    const cutOff = moment().subtract(1, "week").toDate();
    for (const [relay, arr] of this.relayResponseTimes) {
      while (true) {
        const lastResponse = arr.pop();
        if (!lastResponse) break;
        if (lastResponse[1] >= cutOff) {
          arr.push(lastResponse);
          break;
        }
      }
    }
  }
  pruneResponseDisconnects() {
    const cutOff = moment().subtract(1, "week").toDate();
    for (const [relay, arr] of this.relayDisconnects) {
      while (true) {
        const lastDisconnect = arr.pop();
        if (!lastDisconnect) break;
        if (lastDisconnect >= cutOff) {
          arr.push(lastDisconnect);
          break;
        }
      }
    }
  }

  getAverageResponseTime(relay: string) {
    const times = this.relayResponseTimes.get(relay);
    if (times.length === 0) return Infinity;
    const total = times.reduce((total, [time]) => total + time, 0);
    return total / times.length;
  }
  getDisconnects(relay: string) {
    return this.relayDisconnects.get(relay).length;
  }

  getRankedRelays(customRelays?: string[]) {
    const relays = customRelays ?? Array.from(this.relays);
    const relayAverageResponseTimes = new SuperMap<string, number>(() => 0);
    const relayDisconnects = new SuperMap<string, number>(() => 0);

    for (const relay of relays) {
      const averageResponseTime = this.getAverageResponseTime(relay);
      const disconnectTimes = this.relayDisconnects.get(relay).length;
      relayAverageResponseTimes.set(relay, averageResponseTime);
      relayDisconnects.set(relay, disconnectTimes);
    }

    return relays.sort((a, b) => {
      let diff = 0;
      diff += Math.sign(relayAverageResponseTimes.get(a) - relayAverageResponseTimes.get(b));
      diff += Math.sign(relayDisconnects.get(a) - relayDisconnects.get(b));
      return diff;
    });
  }

  async loadStats() {
    const stats = await db.getAll("relayScoreboardStats");

    for (const relayStats of stats) {
      this.relays.add(relayStats.relay);
      this.relayResponseTimes.set(relayStats.relay, relayStats.responseTimes);
      this.relayDisconnects.set(relayStats.relay, relayStats.disconnects);
    }
  }

  async saveStats() {
    const transaction = db.transaction("relayScoreboardStats", "readwrite");
    for (const relay of this.relays) {
      const responseTimes = this.relayResponseTimes.get(relay);
      const disconnects = this.relayDisconnects.get(relay);
      transaction.store.put({ relay, responseTimes, disconnects });
    }
    await transaction.done;
  }
}

const relayScoreboardService = new RelayScoreboardService();

relayScoreboardService.loadStats().then(() => {
  console.log("Loaded relay scoreboard stats");
});

setInterval(() => {
  relayScoreboardService.saveStats();
}, 1000 * 5);

if (import.meta.env.DEV) {
  // @ts-ignore
  window.relayScoreboardService = relayScoreboardService;
}

export default relayScoreboardService;
