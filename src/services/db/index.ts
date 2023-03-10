import { openDB, deleteDB } from "idb";

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
    const userMetadata = db.createObjectStore("userMetadata", {
      keyPath: "pubkey",
    });
    userMetadata.createIndex("created_at", "created_at");

    const userRelays = db.createObjectStore("userRelays", {
      keyPath: "pubkey",
    });
    userRelays.createIndex("created_at", "created_at");

    const contacts = db.createObjectStore("userContacts", {
      keyPath: "pubkey",
    });
    contacts.createIndex("created_at", "created_at");

    const userFollows = db.createObjectStore("userFollows", {
      keyPath: "pubkey",
    });
    userFollows.createIndex("follows", "follows", { multiEntry: true, unique: false });

    const dnsIdentifiers = db.createObjectStore("dnsIdentifiers");
    dnsIdentifiers.createIndex("pubkey", "pubkey", { unique: false });
    dnsIdentifiers.createIndex("name", "name", { unique: false });
    dnsIdentifiers.createIndex("domain", "domain", { unique: false });
    dnsIdentifiers.createIndex("updated", "updated", { unique: false });

    db.createObjectStore("settings");
    db.createObjectStore("relayInfo");
    db.createObjectStore("relayScoreboardStats", { keyPath: "relay" });
    db.createObjectStore("accounts", { keyPath: "pubkey" });
  },
];

const dbName = "storage";
const version = 1;
const db = await openDB<CustomSchema>(dbName, version, {
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

export async function clearCacheData() {
  await db.clear("userMetadata");
  await db.clear("userContacts");
  await db.clear("userFollows");
  await db.clear("userRelays");
  await db.clear("relayInfo");
  await db.clear("dnsIdentifiers");
  await db.clear("relayScoreboardStats");
  window.location.reload();
}

export async function deleteDatabase() {
  db.close();
  await deleteDB(dbName);
  window.location.reload();
}

if (import.meta.env.DEV) {
  // @ts-ignore
  window.db = db;
}

export default db;
