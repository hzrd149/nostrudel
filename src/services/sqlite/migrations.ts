import { capSQLiteVersionUpgrade, SQLiteConnection } from "@capacitor-community/sqlite";
import { logger } from "../../helpers/debug";

const log = logger.extend("sqlite-migrations");

export interface Migration {
  version: number;
  description: string;
  up: string[];
  down?: string[];
}

export const migrations: capSQLiteVersionUpgrade[] = [
  {
    toVersion: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY NOT NULL,
        created_at INTEGER NOT NULL,
        pubkey TEXT NOT NULL,
        sig TEXT NOT NULL,
        kind INTEGER NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL,
        identifier TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_events_pubkey ON events(pubkey)`,
      `CREATE INDEX IF NOT EXISTS idx_events_kind ON events(kind)`,
      `CREATE INDEX IF NOT EXISTS idx_events_identifier ON events(identifier)`,
      `CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event TEXT NOT NULL,
        tag TEXT NOT NULL,
        value TEXT NOT NULL,
        FOREIGN KEY (event) REFERENCES events(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_tags_event ON tags(event)`,
      `CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag)`,
      `CREATE INDEX IF NOT EXISTS idx_tags_value ON tags(value)`,
    ],
  },
];

/**
 * Get the current database version (highest migration version)
 */
export function getCurrentDatabaseVersion(): number {
  return Math.max(...migrations.map((m) => m.toVersion), 0);
}

/**
 * Setup database migrations using addUpgradeStatement method
 * This should be called before opening the database
 */
export async function setupMigrations(sqlite: SQLiteConnection, databaseName: string): Promise<void> {
  log("Setting up migrations for database:", databaseName);

  try {
    log(`Setting up ${migrations.length} migration(s)`);

    // Call addUpgradeStatement with the upgrade definitions
    await sqlite.addUpgradeStatement(databaseName, migrations);

    log("Migrations setup successfully");
  } catch (error) {
    log("Migration setup failed:", error);
    throw error;
  }
}

// Legacy function for backwards compatibility - now just logs a warning
export async function runMigrations(sqlite: any): Promise<void> {
  log("WARNING: runMigrations is deprecated. Use setupMigrations instead.");
}
