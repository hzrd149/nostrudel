import { BehaviorSubject } from "rxjs";
import type { HandlerPreference } from "../helpers/nostr/handler-preferences";
import type { NostrEvent } from "nostr-tools";

/** Synced preferences are independent of installation state. Decrypted tags stay in memory. */
export const handlerPreferences$ = new BehaviorSubject<ReadonlyMap<string, HandlerPreference>>(new Map());
export const handlerManifests$ = new BehaviorSubject<ReadonlyMap<string, NostrEvent>>(new Map());
