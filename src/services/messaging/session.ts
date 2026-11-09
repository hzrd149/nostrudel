import { LegacyMessagesClient, WrappedMessagesClient } from "applesauce-extra/messages";
import type { LegacyMessagesClientOptions, WrappedMessagesClientOptions } from "applesauce-extra/messages";
import { isGiftWrapUnlocked } from "applesauce-common/helpers";
import { BehaviorSubject, Observable, Subscription, combineLatest, map, merge } from "rxjs";
import { MessagePublication } from "./publication";
import { ConversationPages } from "./conversation-pages";
import { WrappedOutbox } from "./wrapped-outbox";

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
  readonly pages: ConversationPages;
  private readonly lifetime = new AbortController();
  private readonly subscriptions = new Subscription();
  private readonly publications = new Map<string, MessagePublication>();
  private readonly outboxes = new Map<string, WrappedOutbox>();

  outbox(recipients: string[]) {
    const conversation = this.wrapped.conversation(recipients);
    let outbox = this.outboxes.get(conversation.id);
    if (!outbox) {
      outbox = new WrappedOutbox(conversation);
      this.outboxes.set(conversation.id, outbox);
    }
    return outbox;
  }

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
    this.pages = new ConversationPages([
      this.legacy.conversations({ signal: this.lifetime.signal }),
      this.wrapped.conversations({ signal: this.lifetime.signal }),
    ]);
    this.conversations$ = this.pages.rows$;
    this.add(
      merge(
        this.legacy.conversationInserts$,
        this.legacy.conversationUpdates$,
        this.wrapped.conversationInserts$,
        this.wrapped.conversationUpdates$,
      ).subscribe((row) => this.pages.update(row)),
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
    this.lifetime.abort();
    this.pages.dispose();
    this.subscriptions.unsubscribe();
    for (const publication of this.publications.values()) publication.dispose();
    this.publications.clear();
    for (const outbox of this.outboxes.values()) outbox.dispose();
    this.outboxes.clear();
    this.legacy.dispose();
    this.wrapped.dispose();
    this.errors$.complete();
  }
}
