import { Filter, NostrEvent } from "nostr-tools";
import { Observable } from "rxjs";

export interface EventCache {
  type: string;
  read(filters: Filter[]): Observable<NostrEvent>;
  write(events: NostrEvent[]): Promise<any>;
  search?: (filters: Filter[]) => Observable<NostrEvent>;
  clear?: () => Promise<void>;
}
