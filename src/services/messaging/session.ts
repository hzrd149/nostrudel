import { LegacyMessagesClient, WrappedMessagesClient } from "applesauce-extra/messages";
import type { LegacyMessagesClientOptions, WrappedMessagesClientOptions } from "applesauce-extra/messages";
import { isGiftWrapUnlocked } from "applesauce-common/helpers";
import { BehaviorSubject, Observable, Subscription, combineLatest, map, merge, scan, shareReplay } from "rxjs";
import { MessagePublication } from "./publication";

export type MessageConversation = {
  id: string;
  participants: string[];
  lastActivity: number;
  lastMessage?: import("applesauce-core/helpers").NostrEvent | import("applesauce-core/helpers").Rumor;
};

/** Owns messaging work for one immutable account; the pool and encrypted event store remain application-owned. */
export class MessagingSession {
  readonly legacy: LegacyMessagesClient;
  readonly wrapped: WrappedMessagesClient;
  readonly conversations$: Observable<MessageConversation[]>;
  readonly locked$;
  readonly relays$;
  readonly errors$ = new BehaviorSubject<string[]>([]);
  private readonly subscriptions = new Subscription();
  private readonly publications = new Map<string, MessagePublication>();

  publication(protocol: "nip04" | "nip17", recipients: string[]) {
    const participants = [...new Set(protocol === "nip17" ? [...recipients, this.wrapped.pubkey] : recipients)].sort();
    const key = `${protocol}:${participants.join(",")}`;
    let publication = this.publications.get(key);
    if (!publication) {
      publication = new MessagePublication((request, signal) =>
        protocol === "nip04"
          ? this.legacy.prepareSend({ recipient: recipients[0], ...request }, { signal })
          : this.wrapped.prepareSend({ recipients: participants, ...request }, { signal }),
      );
      this.publications.set(key, publication);
    }
    return publication;
  }

  constructor(legacyOptions: LegacyMessagesClientOptions, wrappedOptions: WrappedMessagesClientOptions) {
    this.legacy = new LegacyMessagesClient(legacyOptions);
    this.wrapped = new WrappedMessagesClient(wrappedOptions);
    this.relays$ = combineLatest([this.legacy.relays$, this.wrapped.relays$]).pipe(
      map(([legacy, wrapped]) => [...new Set([...legacy, ...wrapped])]),
    );
    this.locked$ = combineLatest([this.wrapped.giftWraps$, this.wrapped.receiver.decryptionState$]).pipe(
      map(([events, state]) => events.filter((event) => !isGiftWrapUnlocked(event) && !state.errors.has(event.id))),
    );
    this.conversations$ = new Observable<MessageConversation>((subscriber) => {
      const controller = new AbortController();
      const sub = merge(
        this.legacy.conversationInserts$,
        this.legacy.conversationUpdates$,
        this.wrapped.conversationInserts$,
        this.wrapped.conversationUpdates$,
      ).subscribe(subscriber);
      const restore = async () => {
        for (const client of [this.legacy, this.wrapped]) {
          for await (const conversation of client.conversations({ signal: controller.signal })) {
            subscriber.next(conversation);
          }
        }
      };
      void restore().catch((error) => {
        if (!controller.signal.aborted) subscriber.error(error);
      });
      return () => {
        controller.abort();
        sub.unsubscribe();
      };
    }).pipe(
      scan((rows, row) => {
        const previous = rows.get(row.id);
        if (!previous || row.lastActivity >= previous.lastActivity) return new Map(rows).set(row.id, row);
        return rows;
      }, new Map<string, MessageConversation>()),
      map((rows) => [...rows.values()].sort((a, b) => b.lastActivity - a.lastActivity)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  async start() {
    this.errors$.next([]);
    await Promise.all([this.legacy.start(), this.wrapped.start()]);
  }

  report(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.errors$.next([...new Set([...this.errors$.value, message])].slice(-5));
  }

  setAutoUnlock(enabled: boolean) {
    this.legacy.setAutoUnlock(enabled);
    this.wrapped.setAutoUnlock(enabled);
  }

  /** Session-owned subscriptions are torn down before the clients invalidate their operations. */
  add(subscription: Subscription) {
    this.subscriptions.add(subscription);
  }

  dispose() {
    this.subscriptions.unsubscribe();
    for (const publication of this.publications.values()) publication.dispose();
    this.publications.clear();
    this.legacy.dispose();
    this.wrapped.dispose();
    this.errors$.complete();
  }
}
