import type { IAsyncEventDatabase } from "applesauce-core/event-store";
import { matchFilter, type Filter, type Rumor } from "applesauce-core/helpers";
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { type EncryptedValue, MessageCipher } from "./storage";

type Record = Omit<Rumor, "content" | "tags"> & { tags: string[][]; payload: EncryptedValue };
interface Schema extends DBSchema {
  rumors: { key: string; value: Record; indexes: { time: [number, string] } };
}

/** Queryable NIP-01 metadata with authenticated encryption of the full rumor, including file keys. */
export class RumorDatabase implements IAsyncEventDatabase<Rumor> {
  private constructor(
    private readonly db: IDBPDatabase<Schema>,
    private readonly cipher: MessageCipher,
  ) {}

  static async open(name: string, cipher: MessageCipher) {
    const db = await openDB<Schema>(name, 1, {
      upgrade(db) {
        db.createObjectStore("rumors", { keyPath: "id" }).createIndex("time", ["created_at", "id"]);
      },
    });
    return new RumorDatabase(db, cipher);
  }

  close() {
    this.db.close();
  }

  private decode(record: Record): Rumor {
    return JSON.parse(new TextDecoder().decode(this.cipher.decrypt(record.payload)));
  }

  async add(rumor: Rumor) {
    await this.db.put("rumors", {
      id: rumor.id,
      pubkey: rumor.pubkey,
      kind: rumor.kind,
      created_at: rumor.created_at,
      // Only NIP-01 query tags are indexed. Encryption keys, URLs, and other attachment metadata stay encrypted.
      tags: rumor.tags.filter((tag) => tag[0].length === 1).map((tag) => tag.slice(0, 2)),
      payload: this.cipher.encrypt(new TextEncoder().encode(JSON.stringify(rumor))),
    });
    return rumor;
  }

  async getEvent(id: string) {
    const record = await this.db.get("rumors", id);
    return record && this.decode(record);
  }
  async hasEvent(id: string) {
    return (await this.db.count("rumors", id)) > 0;
  }

  private async records(filter: Filter): Promise<Record[]> {
    if (filter.limit === 0 || (filter.since ?? 0) > (filter.until ?? Number.MAX_SAFE_INTEGER)) return [];
    const tx = this.db.transaction("rumors");
    const range = IDBKeyRange.bound([filter.since ?? 0, ""], [filter.until ?? Number.MAX_SAFE_INTEGER, "\uffff"]);
    let cursor = await tx.store.index("time").openCursor(range, "prev");
    const result: Record[] = [];
    while (cursor) {
      if (matchFilter(filter, { ...cursor.value, content: "" })) result.push(cursor.value);
      if (filter.limit !== undefined && result.length >= filter.limit) break;
      cursor = await cursor.continue();
    }
    return result;
  }

  async getByFilters(filters: Filter | Filter[]) {
    const pages = await Promise.all(
      (Array.isArray(filters) ? filters : [filters]).map((filter) => this.records(filter)),
    );
    const records = [...new Map(pages.flat().map((record) => [record.id, record])).values()];
    return records
      .sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id))
      .map((record) => this.decode(record));
  }
  getTimeline(filters: Filter | Filter[]) {
    return this.getByFilters(filters);
  }
  async getReplaceableHistory(kind: number, pubkey: string, identifier?: string) {
    const rows = await this.getByFilters({
      kinds: [kind],
      authors: [pubkey],
      ...(identifier === undefined ? {} : { "#d": [identifier] }),
    });
    return rows.length ? rows : undefined;
  }
  async getReplaceable(kind: number, pubkey: string, identifier?: string) {
    return (await this.getReplaceableHistory(kind, pubkey, identifier))?.[0];
  }
  async hasReplaceable(kind: number, pubkey: string, identifier?: string) {
    return !!(await this.getReplaceable(kind, pubkey, identifier));
  }
  async remove(event: string | Rumor) {
    const id = typeof event === "string" ? event : event.id;
    const tx = this.db.transaction("rumors", "readwrite");
    const exists = (await tx.store.count(id)) > 0;
    await tx.store.delete(id);
    await tx.done;
    return exists;
  }
  async removeByFilters(filters: Filter | Filter[]) {
    const rows = await this.getByFilters(filters);
    const tx = this.db.transaction("rumors", "readwrite");
    await Promise.all(rows.map((row) => tx.store.delete(row.id)));
    await tx.done;
    return rows.length;
  }
}
