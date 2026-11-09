import { BehaviorSubject } from "rxjs";
import type { HandlerPreference } from "../helpers/nostr/handler-preferences";
import type { NostrEvent } from "nostr-tools";

/** Decrypted account preference tags stay in memory. */
export const handlerPreferences$ = new BehaviorSubject<ReadonlyMap<string, HandlerPreference>>(new Map());
export const handlerManifests$ = new BehaviorSubject<ReadonlyMap<string, NostrEvent>>(new Map());
/** Device choices and legacy explicit defaults, scoped to the active account. */
export const localHandlerPreferences$ = new BehaviorSubject<Record<string, string>>({});
