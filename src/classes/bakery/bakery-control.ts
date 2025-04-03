import { firstValueFrom, map, Observable, scan, shareReplay, skip, tap } from "rxjs";
import { PrivateNodeConfig } from "@satellite-earth/core/types";
import { Relay } from "applesauce-relay";
import hash_sum from "hash-sum";

import { LogEntry, NetworkStateResult } from "./types";
import { scanToArray } from "../../helpers/observable";

export default class BakeryControlApi {
  queries = new Map<string, Observable<any>>();

  config: Observable<PrivateNodeConfig>;
  network: Observable<NetworkStateResult>;
  services: Observable<string[]>;

  constructor(public bakery: Relay) {
    this.config = this.query<PrivateNodeConfig>("config", {}).pipe(shareReplay(1));
    this.network = this.query<NetworkStateResult>("network-status", {}).pipe(shareReplay(1));
    this.services = this.query<{ id: string }>("services", {}).pipe(
      scan((arr, service) => (arr.includes(service.id) ? arr : [...arr, service.id]), [] as string[]),
      shareReplay(1),
    );
  }

  query<T extends unknown = unknown, R extends unknown = T>(
    type: string,
    args: any,
    modify: (source: Observable<T>) => Observable<R>,
  ): Observable<R>;
  query<T extends unknown = unknown>(type: string, args: any): Observable<T>;
  query<T extends unknown = unknown, R extends unknown = T>(
    type: string,
    args: any,
    modify?: (source: Observable<T>) => Observable<R>,
  ): Observable<R> {
    const id = hash_sum([type, args]);
    const existing = this.queries.get(id);
    if (existing) return existing;

    let query = this.bakery
      .multiplex(
        () => ["QRY", "OPEN", type, id, args],
        () => ["QRY", "CLOSE", id],
        (m) => m[0] === "QRY" && (m[1] === "DATA" || m[1] === "ERR") && m[2] === id,
      )
      .pipe(
        map((message: any) => {
          // throw error
          if (message[1] === "ERR") throw new Error(message[2]);
          // return data
          else return message[3];
        }),
        // cleanup when query is complete
        tap({
          complete: () => {
            // cleanup query
            this.queries.delete(id);
          },
        }),
      );

    if (modify) query = modify(query);

    // share the observable
    query = query.pipe(shareReplay(1));

    this.queries.set(id, query);

    return query;
  }

  /** gets longs for a service */
  logs(filter: { service?: string; limit?: number }) {
    return this.query<LogEntry, LogEntry[]>("logs", filter, (source) => source.pipe(scanToArray()));
  }

  async setConfigField<T extends keyof PrivateNodeConfig>(field: T, value: PrivateNodeConfig[T]) {
    await this.bakery.next(["CONTROL", "CONFIG", "SET", field, value]);

    // wait for the next change to config
    await firstValueFrom(this.config.pipe(skip(1)));
  }

  async setConfigFields(config: Partial<PrivateNodeConfig>) {
    for (const [field, value] of Object.entries(config)) {
      await this.bakery.next(["CONTROL", "CONFIG", "SET", field, value]);
    }

    // wait for the next change to config
    await firstValueFrom(this.config.pipe(skip(1)));
  }
}
