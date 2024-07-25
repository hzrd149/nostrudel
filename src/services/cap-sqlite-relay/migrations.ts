export const databaseMigrations = [
  {
    toVersion: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS events (
				id TEXT(64) PRIMARY KEY,
				created_at INTEGER,
				pubkey TEXT(64),
				sig TEXT(128),
				kind INTEGER,
				content TEXT,
				tags TEXT
			)`,
      `CREATE TABLE IF NOT EXISTS tags (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				event TEXT(64) REFERENCES events(id),
				type TEXT(1),
				value TEXT
			)`,
      "CREATE INDEX IF NOT EXISTS events_created_at ON events(created_at)",
      "CREATE INDEX IF NOT EXISTS events_pubkey ON events(pubkey)",
      "CREATE INDEX IF NOT EXISTS events_kind ON events(kind)",
      "CREATE INDEX IF NOT EXISTS tags_event ON tags(event)",
      "CREATE INDEX IF NOT EXISTS tags_type ON tags(type)",
      "CREATE INDEX IF NOT EXISTS tags_value ON tags(value)",
    ],
  },
];
