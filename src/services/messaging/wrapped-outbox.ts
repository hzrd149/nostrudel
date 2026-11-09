import type { Emoji, FileMetadataFields } from "applesauce-common/helpers";
import type { MessageDraft, PreparedWrappedMessage, WrappedConversation } from "applesauce-extra/messages";
import { BehaviorSubject } from "rxjs";

export type OutgoingMessage = {
  id: number;
  content: string;
  emojis?: Emoji[];
  file?: File;
  replyTo?: string;
  expiration?: number;
  uploaded?: FileMetadataFields;
  prepared?: PreparedWrappedMessage;
  state: "queued" | "preparing" | "publishing" | "failed" | "accepted";
  error?: string;
};

/** Session-owned queue: a file upload and a prepared envelope are reused independently on retry. */
export class WrappedOutbox {
  readonly items$ = new BehaviorSubject<OutgoingMessage[]>([]);
  private nextId = 0;
  private readonly lifetime = new AbortController();

  constructor(readonly conversation: WrappedConversation) {}

  enqueue(draft: MessageDraft & { emojis?: Emoji[] }): OutgoingMessage[] {
    this.lifetime.signal.throwIfAborted();
    const common = { replyTo: draft.replyTo, expiration: draft.expiration, state: "queued" as const };
    const items: OutgoingMessage[] = (draft.files ?? []).map((file) => ({
      ...common,
      id: ++this.nextId,
      content: "",
      file,
    }));
    if (draft.content.trim())
      items.push({ ...common, id: ++this.nextId, content: draft.content, emojis: draft.emojis });
    this.items$.next([...this.items$.value, ...items]);
    return items;
  }

  private update(item: OutgoingMessage, changes: Partial<OutgoingMessage>) {
    Object.assign(item, changes);
    if (!this.lifetime.signal.aborted) this.items$.next([...this.items$.value]);
  }

  async retry(item: OutgoingMessage) {
    this.lifetime.signal.throwIfAborted();
    if (
      !this.items$.value.includes(item) ||
      item.state === "preparing" ||
      item.state === "publishing" ||
      item.state === "accepted"
    )
      return;
    const options = { signal: this.lifetime.signal };
    this.update(item, { state: "preparing", error: undefined });
    try {
      if (!item.prepared) {
        if (item.file && !item.uploaded) item.uploaded = await this.conversation.uploadFile(item.file, options);
        options.signal.throwIfAborted();
        item.prepared = await this.conversation.prepareSend(
          {
            content: item.content,
            emojis: item.emojis,
            file: item.uploaded,
            replyTo: item.replyTo,
            expiration: item.expiration,
            envelopeExpiration: item.expiration,
          },
          options,
        );
      }
      options.signal.throwIfAborted();
      this.update(item, { state: "publishing" });
      await item.prepared.publish(options);
      options.signal.throwIfAborted();
      this.update(item, { state: "accepted", file: undefined });
    } catch (error) {
      if (!options.signal.aborted)
        this.update(item, { state: "failed", error: error instanceof Error ? error.message : String(error) });
    }
  }

  discard(item: OutgoingMessage) {
    if (item.state === "preparing" || item.state === "publishing") return;
    this.items$.next(this.items$.value.filter((entry) => entry !== item));
  }

  dispose() {
    this.lifetime.abort();
    this.items$.next([]);
    this.items$.complete();
  }
}
