import { RelayPool, PublishResponse } from "applesauce-relay";
import { NostrEvent } from "nostr-tools";
import { catchError, defer, merge, Observable, of } from "rxjs";

/** Stream individual relay verdicts while retaining v7's high-level publish policy. */
export default function publishToRelays(
  pool: RelayPool,
  relays: string[],
  event: NostrEvent,
  authenticateAs: string,
): Observable<PublishResponse> {
  return merge(
    ...relays.map((url) =>
      defer(() => pool.relay(url).publish(event, { waitForAuth: authenticateAs })).pipe(
        catchError((error) =>
          of({ ok: false, from: url, message: error instanceof Error ? error.message : "Publish failed", error }),
        ),
      ),
    ),
  );
}
