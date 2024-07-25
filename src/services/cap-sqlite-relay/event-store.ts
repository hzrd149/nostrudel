import { Filter, NostrEvent, kinds } from "nostr-tools";
import EventEmitter from "eventemitter3";
import { type SQLiteDBConnection } from "@capacitor-community/sqlite";

import { logger } from "../../helpers/debug";

const isFilterKeyIndexableTag = (key: string) => {
  return key[0] === "#" && key.length === 2;
};

function mapParams(params: any[]) {
  return `(${params.map(() => `?`).join(", ")})`;
}

type EventMap = {
  "event:inserted": [NostrEvent];
  "event:removed": [string];
};

export default class SQLiteEventStore extends EventEmitter<EventMap> {
  database: SQLiteDBConnection;
  log = logger.extend("SQLiteEventStore");

  constructor(db: SQLiteDBConnection) {
    super();
    this.database = db;
  }

  private async transaction<T extends unknown>(run: () => Promise<T>): Promise<T> {
    await this.database.beginTransaction();
    const isTransAct = await this.database.isTransactionActive();
    if (!isTransAct) throw new Error("Database Transaction not Active");
    try {
      const result = await run();
      await this.database.commitTransaction();
      return result;
    } catch (err) {
      await this.database.rollbackTransaction();
      throw err;
    }
  }

  async addEvent(
    event: NostrEvent,
    options: {
      preserveEphemeral?: boolean;
      preserveReplaceable?: boolean;
    } = {},
  ) {
    // Don't store ephemeral events in db,
    // just return the event directly
    if (!options.preserveEphemeral && kinds.isEphemeralKind(event.kind)) return false;

    const inserted = await this.transaction(async () => {
      // TODO: Check if event is replaceable and if its newer
      // before inserting it into the database

      const insert = await this.database.run(
        `
				INSERT OR IGNORE INTO events (id, created_at, pubkey, sig, kind, content, tags)
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`,
        [event.id, event.created_at, event.pubkey, event.sig, event.kind, event.content, JSON.stringify(event.tags)],
        false,
      );

      // If event inserted, index tags
      if (insert.changes?.changes) {
        for (let tag of event.tags) {
          // add single tags into tags table
          if (tag[0].length === 1) {
            await this.database.run(
              `INSERT INTO tags (event, type, value) VALUES (?, ?, ?)`,
              [event.id, tag[0], tag[1]],
              false,
            );
          }
        }

        // By default, remove older replaceable
        // events and all their associated tags
        if (!options.preserveReplaceable) {
          let existing: { id: string; created_at: number }[] = [];

          if (kinds.isReplaceableKind(event.kind)) {
            // Normal replaceable event
            existing =
              (
                await this.database.query(
                  `SELECT events.id, events.created_at FROM events WHERE kind = ? AND pubkey = ?`,
                  [event.kind, event.pubkey],
                  false,
                )
              ).values ?? ([] as { id: string; created_at: number }[]);
          } else if (kinds.isParameterizedReplaceableKind(event.kind)) {
            // Parameterized Replaceable
            const d = event.tags.find((t) => t[0] === "d")?.[1];

            if (d) {
              existing =
                (
                  await this.database.query(
                    `
                    SELECT events.id, events.created_at FROM events
                    INNER JOIN tags ON events.id = tags.event
                    WHERE kind = ? AND pubkey = ? AND tags.type = ? AND tags.value = ?
                  `,
                    [event.kind, event.pubkey, "d", d],
                    false,
                  )
                ).values ?? ([] as { id: string; created_at: number }[]);
            }
          }

          // If found other events that may need to be replaced,
          // sort the events according to timestamp descending,
          // falling back to id lexical order ascending as per
          // NIP-01. Remove all non-most-recent events and tags.
          if (existing.length > 1) {
            const removeIds = existing
              .sort((a, b) => {
                return a.created_at === b.created_at ? a.id.localeCompare(b.id) : b.created_at - a.created_at;
              })
              .slice(1)
              .map((item) => item.id);

            if (!removeIds.includes(event.id)) this.log("Removed", removeIds.length, "old replaceable events");

            this.removeEvents(removeIds);

            // If the event that was just inserted was one of
            // the events that was removed, return null so to
            // indicate that the event was in effect *not*
            // upserted and thus, if using the DB for a nostr
            // relay, does not need to be pushed to clients
            if (removeIds.indexOf(event.id) !== -1) return false;
          }
        }

        return true;
      }
      return false;
    });

    if (inserted) this.emit("event:inserted", event);

    return inserted;
  }

  async removeEvents(ids: string[]) {
    const result = await this.transaction(async () => {
      await this.database.run(`DELETE FROM tags WHERE event IN ${mapParams(ids)}`, [...ids], false);
      return await this.database.run(`DELETE FROM events WHERE events.id IN ${mapParams(ids)}`, [...ids], false);
    });

    if (result.changes?.changes) {
      for (const id of ids) {
        this.emit("event:removed", id);
      }
    }
  }

  async removeEvent(id: string) {
    const results = await this.transaction(async () => {
      await this.database.run(`DELETE FROM tags WHERE tags.event = ?`, [id], false);

      return await this.database.run(`DELETE FROM events WHERE events.id = ?`, [id], false);
    });

    if (results.changes?.changes ?? 0 > 0) this.emit("event:removed", id);

    return results.changes?.changes ?? 0 > 0;
  }

  buildConditionsForFilters(filter: Filter) {
    const joins: string[] = [];
    const conditions: string[] = [];
    const parameters: (string | number)[] = [];

    const tagQueries = Object.keys(filter).filter((t) => {
      return isFilterKeyIndexableTag(t);
    });

    if (tagQueries.length > 0) {
      joins.push("INNER JOIN tags ON events.id = tags.event");
    }

    if (typeof filter.since === "number") {
      conditions.push(`events.created_at >= ?`);
      parameters.push(filter.since);
    }

    if (typeof filter.until === "number") {
      conditions.push(`events.created_at < ?`);
      parameters.push(filter.until);
    }

    if (filter.ids) {
      conditions.push(`events.id IN ${mapParams(filter.ids)}`);
      parameters.push(...filter.ids);
    }

    if (filter.kinds) {
      conditions.push(`events.kind IN ${mapParams(filter.kinds)}`);
      parameters.push(...filter.kinds);
    }

    if (filter.authors) {
      conditions.push(`events.pubkey IN ${mapParams(filter.authors)}`);
      parameters.push(...filter.authors);
    }

    for (let t of tagQueries) {
      conditions.push(`tags.type = ?`);
      parameters.push(t.slice(1));

      // @ts-expect-error
      const v = filter[t] as string[];
      conditions.push(`tags.value IN ${mapParams(v)}`);
      parameters.push(...v);
    }

    return { conditions, parameters, joins };
  }

  protected buildSQLQueryForFilters(filters: Filter[]) {
    let sql = "SELECT events.* FROM events ";

    const orConditions: string[] = [];
    const parameters: (string | number)[] = [];

    let joins = new Set<string>();
    for (const filter of filters) {
      const parts = this.buildConditionsForFilters(filter);

      if (parts.conditions.length > 0) {
        orConditions.push(`(${parts.conditions.join(" AND ")})`);
        parameters.push(...parts.parameters);

        for (const join of parts.joins) joins.add(join);
      }
    }

    sql += Array.from(joins).join(" ");

    if (orConditions.length > 0) {
      sql += ` WHERE ${orConditions.join(" OR ")}`;
    }

    sql = sql + " ORDER BY created_at DESC";

    let minLimit = Infinity;
    for (const filter of filters) {
      if (filter.limit) minLimit = Math.min(minLimit, filter.limit);
    }
    if (minLimit !== Infinity) {
      sql += " LIMIT ?";
      parameters.push(minLimit);
    }

    return { sql, parameters };
  }

  async getEventsForFilters(filters: Filter[]) {
    type Row = {
      id: string;
      kind: number;
      pubkey: string;
      content: string;
      tags: string;
      created_at: number;
      sig: string;
    };

    const { sql, parameters } = this.buildSQLQueryForFilters(filters);

    const results = (await this.database.query(sql, parameters)).values ?? ([] as Row[]);

    function parseEventTags(row: Row): NostrEvent {
      return { ...row, tags: JSON.parse(row.tags) };
    }

    return results.map(parseEventTags);
  }

  async countEventsForFilters(filters: Filter[]) {
    let sql = "SELECT count(events.id) as count FROM events ";

    const orConditions: string[] = [];
    const parameters: any[] = [];

    let joins = new Set<string>();
    for (const filter of filters) {
      const parts = this.buildConditionsForFilters(filter);

      orConditions.push(`(${parts.conditions.join(" AND ")})`);
      parameters.push(...parts.parameters);

      for (const join of parts.joins) joins.add(join);
    }

    sql += Array.from(joins).join(" ");

    if (orConditions.length > 0) {
      sql += ` WHERE ${orConditions.join(" OR ")}`;
    }

    const results = (await this.database.query(sql, parameters)).values ?? ([] as { count: number }[]);
    return results[0].count;
  }
}
