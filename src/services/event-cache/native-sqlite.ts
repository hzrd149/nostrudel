import { Filter, NostrEvent } from "nostr-tools";
import { from, mergeMap, Observable, tap } from "rxjs";
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from "@capacitor-community/sqlite";
import { markFromCache } from "applesauce-core/helpers";

import { EventCache } from "./interface";
import { logger } from "../../helpers/debug";
import { buildSQLQueryForFilters } from "../../helpers/sqlite/queries";
import { openConnection } from "../sqlite";
import { setupMigrations, getCurrentDatabaseVersion } from "../sqlite/migrations";

const log = logger.extend("sqlite-cache");
const DB_NAME = "nostrudel_events";

let db: SQLiteDBConnection | null = null;

async function getDatabase(): Promise<SQLiteDBConnection> {
  if (db) return db;

  try {
    log("Opening SQLite database:", DB_NAME);

    // Setup migrations before opening the database
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    await setupMigrations(sqlite, DB_NAME);

    // Get the current database version
    const currentVersion = getCurrentDatabaseVersion();

    // Create database connection with the current version
    db = await openConnection(DB_NAME, false, "no-encryption", currentVersion, false);
    await db.open();

    log("SQLite database initialized");
    return db!;
  } catch (error) {
    log("Failed to initialize SQLite database:", error);
    throw error;
  }
}

function eventToRow(event: NostrEvent) {
  // Find identifier for addressable events (kinds 30000-39999)
  let identifier: string | null = null;
  if (event.kind >= 30000 && event.kind <= 39999) {
    const dTag = event.tags.find((t) => t[0] === "d");
    identifier = dTag?.[1] || "";
  }

  return {
    id: event.id,
    created_at: event.created_at,
    pubkey: event.pubkey,
    sig: event.sig,
    kind: event.kind,
    content: event.content,
    tags: JSON.stringify(event.tags),
    identifier,
  };
}

function rowToEvent(row: any): NostrEvent {
  return {
    id: row.id,
    created_at: row.created_at,
    pubkey: row.pubkey,
    sig: row.sig,
    kind: row.kind,
    content: row.content,
    tags: JSON.parse(row.tags),
  };
}

async function writeEvents(events: NostrEvent[]): Promise<void> {
  if (events.length === 0) return;

  const database = await getDatabase();

  try {
    const statements = [];

    for (const event of events) {
      const row = eventToRow(event);

      // Insert or replace event
      statements.push({
        statement: `INSERT OR REPLACE INTO events (id, created_at, pubkey, sig, kind, content, tags, identifier)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        values: [row.id, row.created_at, row.pubkey, row.sig, row.kind, row.content, row.tags, row.identifier],
      });

      // Delete existing tags for this event
      statements.push({
        statement: `DELETE FROM tags WHERE event = ?`,
        values: [event.id],
      });

      // Insert new tags
      for (const tag of event.tags) {
        if (tag.length >= 2) {
          statements.push({
            statement: `INSERT INTO tags (event, tag, value) VALUES (?, ?, ?)`,
            values: [event.id, tag[0], tag[1]],
          });
        }
      }
    }

    await database.executeSet(statements);
    log(`Stored ${events.length} events`);
  } catch (error) {
    log("Failed to write events:", error);
    throw error;
  }
}

async function readEvents(filters: Filter[]): Promise<NostrEvent[]> {
  if (filters.length === 0) return [];

  const database = await getDatabase();
  const allEvents: NostrEvent[] = [];

  try {
    for (const filter of filters) {
      // Use the existing buildSQLQueryForFilters helper
      const { stmt, parameters } = buildSQLQueryForFilters([filter], "events.*");

      log("Executing query:", stmt, "with params:", parameters);

      const result = await database.query(stmt, parameters);

      if (result.values) {
        const events = result.values.map(rowToEvent);
        allEvents.push(...events);
      }
    }

    log(`Retrieved ${allEvents.length} events from SQLite`);
    return allEvents;
  } catch (error) {
    log("Failed to read events:", error);
    throw error;
  }
}

async function clearCache(): Promise<void> {
  const database = await getDatabase();

  try {
    await database.executeSet([{ statement: "DELETE FROM tags" }, { statement: "DELETE FROM events" }]);
    log("Cache cleared");
  } catch (error) {
    log("Failed to clear cache:", error);
    throw error;
  }
}

// Preload the database
await getDatabase();

const sqliteCache: EventCache = {
  type: "native-sqlite",
  read: (filters) =>
    from(readEvents(filters)).pipe(
      mergeMap((events) => from(events)),
      tap((e) => markFromCache(e)),
    ),
  write: writeEvents,
  clear: clearCache,
};

export default sqliteCache;
