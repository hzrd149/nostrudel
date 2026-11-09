import type { PreparedLegacyMessage, PreparedWrappedMessage } from "applesauce-extra/messages";
import { BehaviorSubject } from "rxjs";

export type PreparedMessage = PreparedLegacyMessage | PreparedWrappedMessage;
export type MessageContent = { content: string; expiration?: number; envelopeExpiration?: number };

/** Keeps the SDK's prepared envelopes across retries and view navigation. */
export class MessagePublication {
  readonly pending$ = new BehaviorSubject<PreparedMessage | undefined>(undefined);
  readonly busy$ = new BehaviorSubject(false);
  private readonly lifetime = new AbortController();

  constructor(private readonly prepare: (request: MessageContent, signal: AbortSignal) => Promise<PreparedMessage>) {}

  async send(request: MessageContent) {
    this.lifetime.signal.throwIfAborted();
    if (this.busy$.value) throw new Error("Message publication is already in progress");
    this.busy$.next(true);
    try {
      const prepared = this.pending$.value ?? (await this.prepare(request, this.lifetime.signal));
      this.lifetime.signal.throwIfAborted();
      this.pending$.next(prepared);
      await prepared.publish({ signal: this.lifetime.signal });
      this.lifetime.signal.throwIfAborted();
      this.pending$.next(undefined);
    } finally {
      this.busy$.next(false);
      // Wrapped publication results are updated on the existing SDK handle.
      if (this.pending$.value) this.pending$.next(this.pending$.value);
    }
  }

  dispose() {
    this.lifetime.abort();
    this.pending$.next(undefined);
    this.pending$.complete();
    this.busy$.complete();
  }
}
