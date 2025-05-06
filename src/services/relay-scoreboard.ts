import dayjs from "dayjs";
import SuperMap from "../classes/super-map";
import db from "./database";

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
    this.averageCache = null;
  }
  getCount() {
    return this.measures.length;
  }

  /** cache the average since it gets called a lot */
  private averageCache: number | null = null;
  getAverage(undef: number = Infinity) {
    if (this.measures.length === 0) return undef;
    if (this.averageCache === null) {
      const total = this.measures.reduce((total, [time]) => total + time, 0);
      this.averageCache = total / this.measures.length;
    }
    return this.averageCache as number;
  }

  reset() {
    this.measures = [];
    this.averageCache = null;
    return this;
  }
  prune(cutOff: Date): this {
    while (true) {
      const last = this.measures.pop();
      if (!last) break;
      if (last[1] >= cutOff) {
        this.measures.push(last);
        this.averageCache = null;
        break;
      }
    }
    return this;
  }

  load(data: any) {
    if (!Array.isArray(data)) return this;
    this.measures = data;
    this.averageCache = null;
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

  prune() {
    const cutOff = dayjs().subtract(1, "week").toDate();
    for (const [_relay, measure] of this.relayResponseTimes) measure.prune(cutOff);
    for (const [_relay, measure] of this.relayEjectTime) measure.prune(cutOff);
    for (const [_relay, measure] of this.relayConnectionTime) measure.prune(cutOff);
  }

  getAverageResponseTime(relay: string) {
    return this.relayResponseTimes.get(relay).getAverage();
  }
  getAverageEjectTime(relay: string) {
    return this.relayEjectTime.get(relay).getAverage();
  }
  getAverageConnectionTime(relay: string) {
    return this.relayConnectionTime.get(relay).getAverage();
  }
  // getTimeoutCount(relay: string) {
  //   return this.relayTimeouts.get(relay).getCount();
  // }

  hasConnected(relay: string) {
    return this.relayConnectionTime.get(relay).getCount() > 0;
  }
  getResponseTimeScore(relay: string) {
    const responseTime = this.getAverageResponseTime(relay);
    const connected = this.hasConnected(relay);

    // no points if we have never connected
    if (!connected) return 0;

    // 1 point (max 10) for ever 10 ms under 1000. negative points for over 1000
    return clamp(Math.round(-(responseTime - 1000) / 100), -10, 10);
  }
  getConnectionTimeScore(relay: string) {
    const connectionTime = this.getAverageConnectionTime(relay);

    // no points if we have never connected
    if (connectionTime === Infinity) return 0;

    // 1 point (max 10) for ever 10 ms under 1000. negative points for over 1000
    return clamp(Math.round(-(connectionTime - 1000) / 100), -10, 10);
  }
  getEjectTimeScore(relay: string) {
    const ejectTime = this.getAverageEjectTime(relay);
    const connected = this.hasConnected(relay);

    // no points if we have never connected
    if (!connected) return 0;

    let score = 0;
    if (ejectTime > 1000 * 20) score += 1;
    if (ejectTime > 1000 * 60) score += 4;
    if (ejectTime > 1000 * 120) score += 5;
    if (ejectTime > 1000 * 200) score += 5;
    return score;
  }
  // getTimeoutsScore(relay: string) {
  //   const timeouts = this.getTimeoutCount(relay);
  //   // subtract 5 points for ever time its timed out
  //   return -(timeouts * 5);
  // }
  getRelayScore(relay: string) {
    let score = 0;

    score += this.getResponseTimeScore(relay);
    score += this.getConnectionTimeScore(relay);
    score += this.getEjectTimeScore(relay);
    // score += this.getTimeoutsScore(relay);

    return score;
  }

  getRankedRelays(urls?: Iterable<string>) {
    const relays = (urls && Array.from(urls)) ?? this.getRelays();
    const relayScores = new Map<string, number>();

    for (const relay of relays) {
      relayScores.set(relay, this.getRelayScore(relay));
    }

    return relays.sort((a, b) => (relayScores.get(b) ?? 0) - (relayScores.get(a) ?? 0));
  }

  private getRelays() {
    const relays = new Set<string>();
    for (const [relay, _measure] of this.relayResponseTimes) relays.add(relay);
    for (const [relay, _measure] of this.relayEjectTime) relays.add(relay);
    for (const [relay, _measure] of this.relayConnectionTime) relays.add(relay);
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

setTimeout(() => {
  relayScoreboardService.loadStats();
}, 0);

setInterval(() => {
  relayScoreboardService.saveStats();
}, 1000 * 30);

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.relayScoreboardService = relayScoreboardService;
}

export default relayScoreboardService;
