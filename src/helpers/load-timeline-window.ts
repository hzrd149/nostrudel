import { TimelineLoader } from "applesauce-loaders/loaders";
import { NostrEvent } from "nostr-tools";
import { Observable, Subscription } from "rxjs";

/** Owns one timeline subscription while cursor updates request further blocks. */
export function loadTimelineWindow(loader: TimelineLoader, cursor$: Observable<number>): Observable<NostrEvent> {
  return new Observable((observer) => {
    const subscriptions = new Subscription();
    // Keep the shared loader alive across cursor updates so in-flight requests are not canceled.
    subscriptions.add(loader({}).subscribe(observer));
    if (!observer.closed) {
      subscriptions.add(
        cursor$.subscribe({
          next: (since) => {
            if (observer.closed) return;
            // Subscribing updates the loader's window synchronously. The owner above receives events.
            loader(since)
              .subscribe({ error: (error) => observer.error(error) })
              .unsubscribe();
          },
          error: (error) => observer.error(error),
          complete: () => observer.complete(),
        }),
      );
    }
    return subscriptions;
  });
}
