import { openDB } from "idb";

import { IDBPDatabase, IDBPTransaction, StoreNames } from "idb";
import { CustomSchema } from "./schema";

type MigrationFunction = (
  database: IDBPDatabase<CustomSchema>,
  transaction: IDBPTransaction<CustomSchema, StoreNames<CustomSchema>[], "versionchange">,
  event: IDBVersionChangeEvent
) => void;

const MIGRATIONS: MigrationFunction[] = [
  // 0 -> 1
  function (db, transaction, event) {
    const metadata = db.createObjectStore("user-metadata", {
      keyPath: "pubkey",
    });

    const eventsSeen = db.createObjectStore("events-seen", { keyPath: "id" });
    eventsSeen.createIndex("lastSeen", "lastSeen");

    const contacts = db.createObjectStore("user-contacts", {
      keyPath: "pubkey",
    });
    // contacts.createIndex("created_at", "created_at");

    const events = db.createObjectStore("text-events", {
      keyPath: "id",
      autoIncrement: false,
    });
    events.createIndex("pubkey", "pubkey");
    events.createIndex("created_at", "created_at");
    events.createIndex("kind", "kind");

    // setup data
    const settings = db.createObjectStore("settings");
    settings.put(
      [
        "wss://relay.damus.io",
        "wss://nostr-pub.wellorder.net",
        "wss://nostr.zebedee.cloud",
        "wss://satstacker.cloud",
        "wss://brb.io",
      ],
      "relays"
    );
  },
];

const version = 1;
const db = await openDB<CustomSchema>("storage", version, {
  upgrade(db, oldVersion, newVersion, transaction, event) {
    // TODO: why is newVersion sometimes null?
    // @ts-ignore
    for (let i = oldVersion; i <= newVersion; i++) {
      if (MIGRATIONS[i]) {
        console.log(`Running database migration ${i}`);
        MIGRATIONS[i](db, transaction, event);
      }
    }
  },
});

export default db;
