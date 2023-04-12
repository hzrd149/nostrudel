import { openDB, deleteDB } from "idb";

import { IDBPDatabase } from "idb";
import { SchemaV1, SchemaV2 } from "./schema";

const dbName = "storage";
const version = 2;
const db = await openDB<SchemaV2>(dbName, version, {
  upgrade(db, oldVersion, newVersion, transaction, event) {
    if (oldVersion < 1) {
      const v0 = db as unknown as IDBPDatabase<SchemaV1>;

      const userMetadata = v0.createObjectStore("userMetadata", {
        keyPath: "pubkey",
      });
      userMetadata.createIndex("created_at", "created_at");

      const userRelays = v0.createObjectStore("userRelays", {
        keyPath: "pubkey",
      });
      userRelays.createIndex("created_at", "created_at");

      const contacts = v0.createObjectStore("userContacts", {
        keyPath: "pubkey",
      });
      contacts.createIndex("created_at", "created_at");

      const userFollows = v0.createObjectStore("userFollows", {
        keyPath: "pubkey",
      });
      userFollows.createIndex("follows", "follows", { multiEntry: true, unique: false });

      const dnsIdentifiers = v0.createObjectStore("dnsIdentifiers");
      dnsIdentifiers.createIndex("pubkey", "pubkey", { unique: false });
      dnsIdentifiers.createIndex("name", "name", { unique: false });
      dnsIdentifiers.createIndex("domain", "domain", { unique: false });
      dnsIdentifiers.createIndex("updated", "updated", { unique: false });

      v0.createObjectStore("settings");
      v0.createObjectStore("relayInfo");
      v0.createObjectStore("relayScoreboardStats", { keyPath: "relay" });
      v0.createObjectStore("accounts", { keyPath: "pubkey" });
    }

    if (oldVersion < 2) {
      const v1 = db as unknown as IDBPDatabase<SchemaV1>;
      const v2 = db as unknown as IDBPDatabase<SchemaV2>;

      // rename the old settings object store to misc
      const oldSettings = transaction.objectStore("settings");
      oldSettings.name = "misc";

      // create new settings object store
      const settings = v2.createObjectStore("settings", {
        keyPath: "pubkey",
      });
      settings.createIndex("created_at", "created_at");
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
