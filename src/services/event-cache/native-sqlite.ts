import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from "@capacitor-community/sqlite";
import { getIndexableTags, getReplaceableIdentifier, markFromCache } from "applesauce-core/helpers";
import {
  buildFiltersQuery,
  DELETE_EVENT_TAGS_STATEMENT,
  HAS_EVENT_STATEMENT,
  INSERT_EVENT_STATEMENT,
  INSERT_EVENT_TAG_STATEMENT,
  rowToEvent,
  type FilterWithSearch,
} from "applesauce-sqlite/helpers";
import { Filter, NostrEvent } from "nostr-tools";
import { from, mergeMap, tap } from "rxjs";

import { logger } from "../../helpers/debug";
import { openConnection } from "../sqlite";
import { getCurrentDatabaseVersion, setupMigrations } from "../sqlite/migrations";
import { EventCache } from "./interface";

const log = logger.extend("sqlite-cache");
const DB_NAME = "nostrudel_events";

// Open the database connection
async function openDatabase(): Promise<SQLiteDBConnection> {
  try {
    log("Opening SQLite database:", DB_NAME);

    // Setup migrations before opening the database
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    await setupMigrations(sqlite, DB_NAME);

    // Get the current database version
    const currentVersion = getCurrentDatabaseVersion();

    // Create database connection with the current version
    const conn = await openConnection(DB_NAME, false, "no-encryption", currentVersion, false);
    await conn.open();

    log("SQLite database initialized");
    return conn!;
  } catch (error) {
    log("Failed to initialize SQLite database:", error);
    throw error;
  }
}

let db: SQLiteDBConnection | Promise<SQLiteDBConnection> | null = null;
function getDatabase(): Promise<SQLiteDBConnection> {
  if (db) return db instanceof Promise ? db : Promise.resolve(db);

  // Return promise and then set db to the connection
  return (db = openDatabase().then((conn) => (db = conn)));
}

/** Inserts an event into the events and event_tags tables */
async function insertEvent(database: SQLiteDBConnection, event: NostrEvent): Promise<boolean> {
  const identifier = getReplaceableIdentifier(event);

  try {
    // Check if event already exists
    const existsResult = await database.query(HAS_EVENT_STATEMENT.sql, [event.id]);
    if (existsResult.values && existsResult.values.length > 0 && (existsResult.values[0][0] as number) > 0) {
      return false; // Event already exists, skip insertion
    }

    const statements = [];

    // Insert the event
    statements.push({
      statement: INSERT_EVENT_STATEMENT.sql,
      values: [
        event.id,
        event.kind,
        event.pubkey,
        event.created_at,
        event.content,
        JSON.stringify(event.tags),
        event.sig,
        identifier,
      ],
    });

    // Delete existing tags for this event
    statements.push({
      statement: DELETE_EVENT_TAGS_STATEMENT.sql,
      values: [event.id],
    });

    // Insert indexable tags into the event_tags table using getIndexableTags
    const indexableTags = getIndexableTags(event);
    if (indexableTags && indexableTags.size > 0) {
      for (const tagString of indexableTags) {
        // Parse the "tagName:tagValue" format
        const [name, value] = tagString.split(":");
        if (name && value) {
          statements.push({
            statement: INSERT_EVENT_TAG_STATEMENT.sql,
            values: [event.id, name, value],
          });
        }
      }
    }

    // Execute all statements atomically
    await database.executeSet(statements);

    return true;
  } catch (error) {
    log("Failed to insert event:", error);
    throw error;
  }
}

async function writeEvents(events: NostrEvent[]): Promise<void> {
  if (events.length === 0) return;

  const database = await getDatabase();

  try {
    let insertedCount = 0;
    for (const event of events) {
      const inserted = await insertEvent(database, event);
      if (inserted) {
        insertedCount++;
      }
    }
    log(`Stored ${insertedCount} new events (${events.length - insertedCount} already existed)`);
  } catch (error) {
    log("Failed to write events:", error);
    throw error;
  }
}

async function readEvents(filters: Filter[]): Promise<NostrEvent[]> {
  if (filters.length === 0) return [];

  const database = await getDatabase();

  try {
    // Use applesauce-sqlite's buildFiltersQuery
    const query = buildFiltersQuery(filters as FilterWithSearch[]);
    if (!query) {
      log("No query generated from filters");
      return [];
    }

    log("Executing query:", query.sql, "with params:", query.params);

    const result = await database.query(query.sql, query.params);

    const events: NostrEvent[] = [];

    if (result.values) {
      // Convert rows to events - rows are arrays, not objects
      for (const row of result.values) {
        events.push(
          rowToEvent({
            id: row[0] as string,
            kind: row[1] as number,
            pubkey: row[2] as string,
            created_at: row[3] as number,
            content: row[4] as string,
            tags: row[5] as string,
            sig: row[6] as string,
          }),
        );
      }
    }

    log(`Retrieved ${events.length} events from SQLite`);
    return events;
  } catch (error) {
    log("Failed to read events:", error);
    throw error;
  }
}

async function clearCache(): Promise<void> {
  const database = await getDatabase();

  try {
    const statements = [
      // Delete from event_tags table (will be cascaded, but explicit is clearer)
      // Note: applesauce-sqlite uses 'event_tags' as the table name
      { statement: "DELETE FROM event_tags" },
      // Delete from events table
      { statement: "DELETE FROM events" },
    ];

    await database.executeSet(statements);
    log("Cache cleared");
  } catch (error) {
    // Some tables might not exist, try just deleting events
    try {
      await database.executeSet([{ statement: "DELETE FROM events" }]);
      log("Cache cleared (partial)");
    } catch (err) {
      log("Failed to clear cache:", error);
      throw error;
    }
  }
}

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
