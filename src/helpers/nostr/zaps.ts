import { NostrEvent } from "nostr-tools";
import { AddressPointer, EventPointer, isETag, isPTag } from "applesauce-core/helpers";
import { ZapEvent } from "applesauce-common/helpers";

export function isNoteZap(event: NostrEvent) {
  return event.tags.some(isETag);
}
export function isProfileZap(event: NostrEvent) {
  return !isNoteZap(event) && event.tags.some(isPTag);
}

export type TZapGroup = {
  key: string;
  eventPointer: EventPointer;
  addressPointer?: AddressPointer;
  events: ZapEvent[];
  latest: number;
};
