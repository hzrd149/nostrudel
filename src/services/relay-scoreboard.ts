import moment from "moment";
import { SuperMap } from "../classes/super-map";
import db from "./db";

interface PersistentMeasure {
  load(data: any): this;
  save(): any;
}
interface RelayMeasure {
  relay: string;
  prune(cutOff: Date): this;
}

class IncidentMeasure implements RelayMeasure, PersistentMeasure {
  relay: string;
  private incidents: Date[] = [];

  constructor(relay: string) {
    this.relay = relay;
  }

  addIncident(date: Date = new Date()) {
    this.incidents.unshift(date);
  }

  prune(cutOff: Date): this {
    while (true) {
      const last = this.incidents.pop();
      if (!last) break;
      if (last >= cutOff) {
        this.incidents.push(last);
        break;
      }
    }
    return this;
  }

  load(data: any) {
    if (!Array.isArray(data)) return this;
    this.incidents = data.sort();
    return this;
  }
  save() {
    return this.incidents;
  }
}

class TimeMeasure implements RelayMeasure, PersistentMeasure {
  relay: string;
  private measures: [number, Date][] = [];

  constructor(relay: string) {
    this.relay = relay;
  }

  createTimer() {
    const start = new Date();
    return () => this.addTime(new Date().valueOf() - start.valueOf());
  }
  addTime(time: number, date: Date = new Date()) {
    this.measures.unshift([time, date]);
  }
  getAverage(since?: Date, undef: number = Infinity) {
    const points = since ? this.measures.filter((m) => m[1] > since) : this.measures;
    if (points.length === 0) return Infinity;
    const total = points.reduce((total, [time]) => total + time, 0);
    return total / points.length;
  }

  prune(cutOff: Date): this {
    while (true) {
      const last = this.measures.pop();
      if (!last) break;
      if (last[1] >= cutOff) {
        this.measures.push(last);
        break;
      }
    }
    return this;
  }

  load(data: any) {
    if (!Array.isArray(data)) return this;
    this.measures = data;
    return this;
  }
  save() {
    return this.measures;
  }
}

class RelayScoreboardService {
  relayResponseTimes = new SuperMap<string, TimeMeasure>((relay) => new TimeMeasure(relay));
  relayEjectTime = new SuperMap<string, TimeMeasure>((relay) => new TimeMeasure(relay));
  relayConnectionTime = new SuperMap<string, TimeMeasure>((relay) => new TimeMeasure(relay));

  prune() {
    const cutOff = moment().subtract(1, "week").toDate();
    for (const [relay, measure] of this.relayResponseTimes) measure.prune(cutOff);
    for (const [relay, measure] of this.relayEjectTime) measure.prune(cutOff);
    for (const [relay, measure] of this.relayConnectionTime) measure.prune(cutOff);
  }

  getAverageResponseTime(relay: string, since?: Date) {
    return this.relayResponseTimes.get(relay).getAverage(since);
  }
  getAverageEjectTime(relay: string, since?: Date) {
    return this.relayEjectTime.get(relay).getAverage(since);
  }
  getAverageConnectionTime(relay: string, since?: Date) {
    return this.relayConnectionTime.get(relay).getAverage(since);
  }

  getRankedRelays(customRelays?: string[]) {
    const relays = customRelays ?? this.getRelays();
    const relayAverageResponseTime = new SuperMap<string, number>(() => 0);
    const relayAverageConnectionTime = new SuperMap<string, number>(() => 0);
    const relayAverageEjectTime = new SuperMap<string, number>(() => 0);

    for (const relay of relays) {
      relayAverageResponseTime.set(relay, this.relayResponseTimes.get(relay).getAverage());
      relayAverageConnectionTime.set(relay, this.relayConnectionTime.get(relay).getAverage());
      relayAverageEjectTime.set(relay, this.relayEjectTime.get(relay).getAverage());
    }

    return relays.sort((a, b) => {
      let diff = 0;
      diff += Math.sign(relayAverageResponseTime.get(a) - relayAverageResponseTime.get(b));
      diff += Math.sign(relayAverageConnectionTime.get(a) - relayAverageConnectionTime.get(b)) / 2;
      diff += Math.sign(relayAverageEjectTime.get(b) - relayAverageEjectTime.get(a));
      return diff;
    });
  }

  private getRelays() {
    const relays = new Set<string>();
    for (const [relay, measure] of this.relayResponseTimes) relays.add(relay);
    for (const [relay, measure] of this.relayEjectTime) relays.add(relay);
    for (const [relay, measure] of this.relayConnectionTime) relays.add(relay);
    return Array.from(relays);
  }

  async loadStats() {
    const stats = await db.getAll("relayScoreboardStats");

    for (const relayStats of stats) {
      this.relayResponseTimes.get(relayStats.relay).load(relayStats.responseTimes);
      this.relayEjectTime.get(relayStats.relay).load(relayStats.ejectTimes);
      this.relayConnectionTime.get(relayStats.relay).load(relayStats.connectionTimes);
    }
  }

  async saveStats() {
    const transaction = db.transaction("relayScoreboardStats", "readwrite");
    const relays = this.getRelays();
    for (const relay of relays) {
      const responseTimes = this.relayResponseTimes.get(relay).save();
      const ejectTimes = this.relayEjectTime.get(relay).save();
      const connectionTimes = this.relayConnectionTime.get(relay).save();
      transaction.store.put({ relay, responseTimes, ejectTimes, connectionTimes });
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
