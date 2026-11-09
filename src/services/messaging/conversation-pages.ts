import { BehaviorSubject } from "rxjs";

export type ConversationSummary = {
  id: string;
  participants: string[];
  lastActivity: number;
  lastMessage?: import("applesauce-core/helpers").NostrEvent | import("applesauce-core/helpers").Rumor;
};

/** Merges two ordered SDK iterators without reading every conversation on first render. */
export class ConversationPages {
  readonly rows$ = new BehaviorSubject<ConversationSummary[]>([]);
  readonly loading$ = new BehaviorSubject(false);
  readonly done$ = new BehaviorSubject(false);
  private readonly rows = new Map<string, ConversationSummary>();
  private heads?: IteratorResult<ConversationSummary>[];
  private disposed = false;

  constructor(private readonly pages: AsyncIterator<ConversationSummary>[]) {}

  update(row: ConversationSummary) {
    if (this.disposed) return;
    const previous = this.rows.get(row.id);
    if (!previous || row.lastActivity >= previous.lastActivity) this.rows.set(row.id, row);
    this.rows$.next(
      [...this.rows.values()].sort((a, b) => b.lastActivity - a.lastActivity || b.id.localeCompare(a.id)),
    );
  }

  async load(count = 30) {
    if (this.disposed || this.loading$.value || this.done$.value) return;
    this.loading$.next(true);
    try {
      this.heads ??= await Promise.all(this.pages.map((page) => page.next()));
      let read = 0;
      while (!this.disposed && read < count) {
        const candidates = this.heads.map((head, index) => ({ head, index })).filter(({ head }) => !head.done);
        candidates.sort(
          (a, b) =>
            b.head.value.lastActivity - a.head.value.lastActivity || b.head.value.id.localeCompare(a.head.value.id),
        );
        const next = candidates[0];
        if (!next) {
          this.done$.next(true);
          break;
        }
        this.update(next.head.value);
        this.heads[next.index] = await this.pages[next.index].next();
        read++;
      }
    } finally {
      this.loading$.next(false);
    }
  }

  dispose() {
    this.disposed = true;
    this.rows$.complete();
    this.loading$.complete();
    this.done$.complete();
  }
}
