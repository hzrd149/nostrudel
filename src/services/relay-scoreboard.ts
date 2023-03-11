import moment from "moment";
import { SuperMap } from "../classes/super-map";
import db from "./db";

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

interface PersistentMeasure {
  load(data: any): this;
  save(): any;
}
interface RelayMeasure {
  relay: string;
  reset(): this;
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
  getCount(since?: Date) {
    const points = since ? this.incidents.filter((d) => d > since) : this.incidents;
    return points.length;
  }

  reset() {
    this.incidents = [];
    return this;
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
  getCount(since?: Date) {
    const points = since ? this.measures.filter((m) => m[1] > since) : this.measures;
    return points.length;
  }
  getAverage(since?: Date, undef: number = Infinity) {
    const points = since ? this.measures.filter((m) => m[1] > since) : this.measures;
    if (points.length === 0) return undef;
    const total = points.reduce((total, [time]) => total + time, 0);
    return total / points.length;
  }

  reset() {
    this.measures = [];
    return this;
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
  /** the time it takes for relays to respond to queries */
  relayResponseTimes = new SuperMap<string, TimeMeasure>((relay) => new TimeMeasure(relay));
  /** the time it takes before the relay closes the connection */
  relayEjectTime = new SuperMap<string, TimeMeasure>((relay) => new TimeMeasure(relay));
  /** the time it takes to connect to the relay */
  relayConnectionTime = new SuperMap<string, TimeMeasure>((relay) => new TimeMeasure(relay));
  /** the number of times the connection has timed out */
  // relayTimeouts = new SuperMap<string, IncidentMeasure>((relay) => new IncidentMeasure(relay));

  prune() {
    const cutOff = moment().subtract(1, "week").toDate();
    for (const [relay, measure] of this.relayResponseTimes) measure.prune(cutOff);
    for (const [relay, measure] of this.relayEjectTime) measure.prune(cutOff);
    for (const [relay, measure] of this.relayConnectionTime) measure.prune(cutOff);
    // for (const [relay, measure] of this.relayTimeouts) measure.prune(cutOff);
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
  // getTimeoutCount(relay: string, since?: Date) {
  //   return this.relayTimeouts.get(relay).getCount(since);
  // }

  hasConnected(relay: string, since?: Date) {
    return this.relayConnectionTime.get(relay).getCount(since) > 0;
  }
  getResponseTimeScore(relay: string, since?: Date) {
    const responseTime = this.getAverageResponseTime(relay, since);
    const connected = this.hasConnected(relay, since);

    // no points if we have never connected
    if (!connected) return 0;

    // 1 point (max 10) for ever 10 ms under 1000. negative points for over 1000
    return clamp(Math.round(-(responseTime - 1000) / 100), -10, 10);
  }
  getConnectionTimeScore(relay: string, since?: Date) {
    const connectionTime = this.getAverageConnectionTime(relay, since);

    // no points if we have never connected
    if (connectionTime === Infinity) return 0;

    // 1 point (max 10) for ever 10 ms under 1000. negative points for over 1000
    return clamp(Math.round(-(connectionTime - 1000) / 100), -10, 10);
  }
  getEjectTimeScore(relay: string, since?: Date) {
    const ejectTime = this.getAverageEjectTime(relay, since);
    const connected = this.hasConnected(relay, since);

    // no points if we have never connected
    if (!connected) return 0;

    let score = 0;
    if (ejectTime > 1000 * 20) score += 1;
    if (ejectTime > 1000 * 60) score += 4;
    if (ejectTime > 1000 * 120) score += 5;
    if (ejectTime > 1000 * 200) score += 5;
    return score;
  }
  // getTimeoutsScore(relay: string, since?: Date) {
  //   const timeouts = this.getTimeoutCount(relay, since);
  //   // subtract 5 points for ever time its timed out
  //   return -(timeouts * 5);
  // }
  getRelayScore(relay: string, since?: Date) {
    let score = 0;

    score += this.getResponseTimeScore(relay, since);
    score += this.getConnectionTimeScore(relay, since);
    score += this.getEjectTimeScore(relay, since);
    // score += this.getTimeoutsScore(relay, since);

    return score;
  }

  getRankedRelays(customRelays?: string[]) {
    const relays = customRelays ?? this.getRelays();
    const relayScores = new Map<string, number>();

    for (const relay of relays) {
      relayScores.set(relay, this.getRelayScore(relay));
    }

    return relays.sort((a, b) => (relayScores.get(b) ?? 0) - (relayScores.get(a) ?? 0));
  }

  private getRelays() {
    const relays = new Set<string>();
    for (const [relay, measure] of this.relayResponseTimes) relays.add(relay);
    for (const [relay, measure] of this.relayEjectTime) relays.add(relay);
    for (const [relay, measure] of this.relayConnectionTime) relays.add(relay);
    // for (const [relay, measure] of this.relayTimeouts) relays.add(relay);
    return Array.from(relays);
  }

  resetScores() {
    this.relayResponseTimes.forEach((m) => m.reset());
    this.relayEjectTime.forEach((m) => m.reset());
    this.relayConnectionTime.forEach((m) => m.reset());
    // this.relayTimeouts.forEach((m) => m.reset());
  }

  async loadStats() {
    const stats = await db.getAll("relayScoreboardStats");

    for (const relayStats of stats) {
      this.relayResponseTimes.get(relayStats.relay).load(relayStats.responseTimes);
      this.relayEjectTime.get(relayStats.relay).load(relayStats.ejectTimes);
      this.relayConnectionTime.get(relayStats.relay).load(relayStats.connectionTimes);
      // this.relayTimeouts.get(relayStats.relay).load(relayStats.timeouts);
    }
  }

  async saveStats() {
    const transaction = db.transaction("relayScoreboardStats", "readwrite");
    const relays = this.getRelays();
    for (const relay of relays) {
      const responseTimes = this.relayResponseTimes.get(relay).save();
      const ejectTimes = this.relayEjectTime.get(relay).save();
      const connectionTimes = this.relayConnectionTime.get(relay).save();
      // const timeouts = this.relayTimeouts.get(relay).save();
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
