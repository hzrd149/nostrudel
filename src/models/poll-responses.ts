import { POLL_RESPONSE_KIND } from "applesauce-common/helpers";
import { Model } from "applesauce-core";
import { NostrEvent } from "nostr-tools";
import { defer, EMPTY, ignoreElements, mergeWith } from "rxjs";

import { pollResponseLoader } from "../services/loaders";

/** Responses to a poll, loading them from `relays` while subscribed. Pass no relays to only read the event store */
export function PollResponsesModel(poll: NostrEvent, relays?: string[]): Model<NostrEvent[]> {
  return (events) =>
    defer(() => (relays ? pollResponseLoader({ value: poll.id, relays }) : EMPTY)).pipe(
      ignoreElements(),
      mergeWith(events.timeline({ kinds: [POLL_RESPONSE_KIND], "#e": [poll.id] })),
    );
}
