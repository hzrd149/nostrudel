import { ConnectionState, createRxNostr, createRxOneshotReq, noopVerifier } from "rx-nostr";
import { BehaviorSubject, combineLatest, map, Observable } from "rxjs";
import { unixNow, addSeenRelay } from "applesauce-core/helpers";
import { nanoid } from "nanoid";

import authenticationSigner from "./authentication-signer";
import localSettings from "./local-settings";
import { unique } from "../helpers/array";
import { Filter, NostrEvent } from "nostr-tools";

const rxNostr = createRxNostr({
  verifier: noopVerifier,
  // don't verify the events at the rx-nostr level
  skipVerify: true,
  authenticator: { signer: authenticationSigner },
  connectionStrategy: "lazy-keep",
  disconnectTimeout: 120_000,
});

// Set the default relays based on local app settings
combineLatest([localSettings.readRelays, localSettings.writeRelays]).subscribe(([read, write]) => {
  const relays = unique([...read, ...write]);

  // update the default relays
  rxNostr.setDefaultRelays(relays.map((url) => ({ url, read: read.includes(url), write: write.includes(url) })));
});

// keep track of all relay connection states
export const connections$ = new BehaviorSubject<Record<string, ConnectionState>>({});
rxNostr.createConnectionStateObservable().subscribe((packet) => {
  // pass to authentication signer so it can cleanup
  authenticationSigner.handleRelayConnectionState(packet);

  const url = new URL(packet.from).toString();
  connections$.next({ ...connections$.value, [url]: packet.state });
});

// capture all notices sent from relays
export const notices$ = new BehaviorSubject<{ id: string; from: string; message: string; timestamp: number }[]>([]);
rxNostr.createAllMessageObservable().subscribe((packet) => {
  if (packet.type === "NOTICE") {
    const from = new URL(packet.from).toString();

    const notice = { id: nanoid(), from, message: packet.notice, timestamp: unixNow() };
    notices$.next([...notices$.value, notice]);
  }
});

// TODO: this should not use one off request, but there isn't a good way to use forward requests
export function nostrRequest(relays: string[], filters: Filter[], id?: string): Observable<NostrEvent> {
  const req = createRxOneshotReq({ filters, rxReqId: id });
  return rxNostr.use(req, { on: { relays } }).pipe(
    map((packet) => {
      addSeenRelay(packet.event, packet.from);
      return packet.event;
    }),
  );
}

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.rxNostr = rxNostr;
}

export default rxNostr;
