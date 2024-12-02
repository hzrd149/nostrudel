import { NostrEvent } from "nostr-tools";
import _throttle from "lodash.throttle";

import { logger } from "../helpers/debug";
import EventEmitter from "eventemitter3";

type EventMap = {
  computed: [];
};

export class PubkeyGraph extends EventEmitter<EventMap> {
  /** the pubkey at the center of it all */
  root: string;
  log = logger.extend("PubkeyGraph");

  /** a map of what pubkeys follow other pubkeys */
  connections = new Map<string, string[]>();
  distance = new Map<string, number>();

  // number of connections a key has at each level
  connectionCount = new Map<string, number>();

  constructor(root: string) {
    super();
    this.root = root;
  }

  handleEvent(event: NostrEvent) {
    const keys = event.tags.filter((t) => t[0] === "p" && t[1]).map((t) => t[1]);
    for (const key of keys) this.changed.add(key);
    this.setPubkeyConnections(event.pubkey, keys);
  }

  setPubkeyConnections(pubkey: string, friends: string[]) {
    this.connections.set(pubkey, friends);
  }

  getByDistance() {
    const dist: Record<number, [string, number | undefined][]> = {};

    for (const [key, d] of this.distance) {
      dist[d] = dist[d] || [];

      dist[d].push([key, this.connectionCount.get(key)]);
    }

    // sort keys
    for (const [d, keys] of Object.entries(dist)) {
      keys.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
    }

    return dist;
  }

  getPubkeyDistance(pubkey: string) {
    const distance = this.distance.get(pubkey);
    if (!distance) return;
    const count = this.connectionCount.get(pubkey);
    return { distance, count };
  }

  sortByDistanceAndConnections(keys: string[]): string[];
  sortByDistanceAndConnections<T>(keys: T[], getKey: (d: T) => string): T[];
  sortByDistanceAndConnections<T>(keys: T[], getKey?: (d: T) => string): T[] {
    return Array.from(keys).sort((a, b) => {
      const aKey = typeof a === "string" ? a : getKey?.(a) || "";
      const bKey = typeof b === "string" ? b : getKey?.(b) || "";

      const v = this.sortComparePubkeys(aKey, bKey);
      if (v === 0) {
        // tied break with original index
        const ai = keys.indexOf(a);
        const bi = keys.indexOf(b);
        if (ai < bi) return -1;
        else if (ai > bi) return 1;
        return 0;
      }
      return v;
    });
  }

  sortComparePubkeys(a: string, b: string) {
    const aDist = this.distance.get(a);
    const bDist = this.distance.get(b);

    if (!aDist && !bDist) return 0;
    else if (aDist && (!bDist || aDist < bDist)) return -1;
    else if (bDist && (!aDist || aDist > bDist)) return 1;

    // a and b are on the same level. compare connections
    const aCount = this.connectionCount.get(a);
    const bCount = this.connectionCount.get(b);

    if (aCount === bCount) return 0;
    else if (aCount && (!bCount || aCount < bCount)) return -1;
    else if (bCount && (!aCount || aCount > bCount)) return 1;

    return 0;
  }

  throttleCompute = _throttle(this.compute.bind(this), 5_000, { leading: false });

  changed = new Set<string>();
  compute() {
    this.distance.clear();

    const next = new Set<string>();
    const refCount = new Map<string, number>();
    const walkLevel = (level = 0) => {
      if (next.size === 0) return;
      const keys = new Set(next);
      next.clear();

      for (const key of keys) {
        this.distance.set(key, level);
        const count = refCount.get(key);
        if (count) this.connectionCount.set(key, count);
      }

      for (const key of keys) {
        const connections = this.connections.get(key);
        if (connections) {
          for (const child of connections) {
            if (!this.distance.has(child)) {
              next.add(child);
              refCount.set(child, (refCount.get(child) ?? 0) + 1);
            }
          }
        }
      }

      walkLevel(level + 1);
    };

    console.time("walk");
    next.add(this.root);
    walkLevel(0);
    console.timeEnd("walk");

    this.emit("computed");
  }

  getPaths(pubkey: string, maxLength = 2) {
    const paths: string[][] = [];

    const walk = (p: string, maxLvl = 0, path: string[] = []) => {
      if (path.includes(p)) return;

      const connections = this.connections.get(p);
      if (!connections) return;

      for (const friend of connections) {
        if (friend === pubkey) {
          paths.push([...path, p, friend]);
        } else if (maxLvl > 0) {
          walk(friend, maxLvl - 1, [...path, p]);
        }
      }
    };

    walk(this.root, maxLength);

    return paths;
  }
}
