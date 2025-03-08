import {
  BehaviorSubject,
  filter,
  map,
  merge,
  NEVER,
  Observable,
  of,
  OperatorFunction,
  shareReplay,
  take,
  takeWhile,
  tap,
  timeout,
} from "rxjs";
import { Filter, NostrEvent } from "nostr-tools";
import { webSocket, WebSocketSubject } from "rxjs/webSocket";

import { logger } from "../../helpers/debug";
import { simpleTimeout } from "applesauce-core/observable";

export type RequestResponse = { type: "EOSE"; id: string } | { type: "EVENT"; id: string; event: NostrEvent };

/** Filter request responses and only return the events */
export function filterEvents(): OperatorFunction<RequestResponse, NostrEvent> {
  return (source) =>
    source.pipe(
      filter((r) => r.type === "EVENT"),
      map((r) => r.event),
    );
}

export default class BakeryRelay {
  log = logger.extend("Bakery");
  public socket$: WebSocketSubject<any[]>;

  connected$ = new BehaviorSubject(false);
  challenge$: Observable<string>;
  authenticated$ = new BehaviorSubject(false);

  constructor(public url: string) {
    this.socket$ = webSocket({
      url,
      openObserver: {
        next: () => {
          this.log("Connected");
          this.connected$.next(true);
          this.authenticated$.next(false);
        },
      },
      closeObserver: {
        next: () => {
          this.log("Disconnected");
          this.connected$.next(false);
          this.authenticated$.next(false);
        },
      },
    });

    // create an observable for listening for AUTH
    this.challenge$ = this.socket$.pipe(
      filter((message) => message[0] === "AUTH"),
      map((m) => m[1]),
      shareReplay(1),
    );
  }

  req(id: string, filters: Filter[]): Observable<RequestResponse> {
    return this.socket$
      .multiplex(
        () => ["REQ", id, ...filters],
        () => ["CLOSE", id],
        (message) => (message[0] === "EVENT" || message[0] === "CLOSE" || message[0] === "EOSE") && message[1] === id,
      )
      .pipe(
        // complete when CLOSE is sent
        takeWhile((m) => m[0] !== "CLOSE"),
        // pick event out of EVENT messages
        map<any[], RequestResponse>((message) => {
          if (message[0] === "EOSE") return { type: "EOSE", id: message[1] };
          else return { type: "EVENT", id: message[1], event: message[2] };
        }),
        // if no events are seen in 10s, emit EOSE
        timeout({
          first: 10_000,
          with: () => merge(of<RequestResponse>({ type: "EOSE", id }), NEVER),
        }),
      );
  }

  protected listenForOk(id: string) {
    return this.socket$.pipe(
      // look for OK message for event
      filter((m) => m[0] === "OK" && m[1] === id),
      // format OK message
      map((m) => ({ ok: m[2], message: m[3] })),
      // complete on first value
      take(1),
    );
  }

  /** send an Event message */
  event(event: NostrEvent): Observable<{ ok: boolean; message?: string }> {
    this.socket$.next(["EVENT", event]);
    return this.listenForOk(event.id).pipe(
      // Throw timeout error if OK is not seen in 10s
      simpleTimeout(10_000, "Timeout"),
    );
  }

  /** send and AUTH message */
  auth(event: NostrEvent): Observable<{ ok: boolean; message?: string }> {
    this.socket$.next(["AUTH", event]);

    return this.listenForOk(event.id).pipe(
      // update authenticated
      tap((result) => this.authenticated$.next(result.ok)),
      // timeout after 5s for AUTH messages
      simpleTimeout(5_000, "Timeout"),
    );
  }
}
