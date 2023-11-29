import { openDB, deleteDB, IDBPDatabase } from "idb";
import { SchemaV1, SchemaV2, SchemaV3, SchemaV4, SchemaV5 } from "./schema";
import { logger } from "../../helpers/debug";

const log = logger.extend("Database");

const dbName = "storage";
const version = 5;
const db = await openDB<SchemaV5>(dbName, version, {
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

    if (oldVersion < 3) {
      const v2 = db as unknown as IDBPDatabase<SchemaV2>;
      const v3 = db as unknown as IDBPDatabase<SchemaV3>;

      // rename the old event caches
      v3.deleteObjectStore("userMetadata");
      v3.deleteObjectStore("userContacts");
      v3.deleteObjectStore("userRelays");
      v3.deleteObjectStore("settings");

      // create new replaceable event object store
      const settings = v3.createObjectStore("replaceableEvents", {
        keyPath: "addr",
      });
      settings.createIndex("created", "created");
    }

    if (oldVersion < 4) {
      const v3 = db as unknown as IDBPDatabase<SchemaV3>;
      const v4 = db as unknown as IDBPDatabase<SchemaV4>;

      // rename the tables
      v3.deleteObjectStore("userFollows");

      // create new search table
      v4.createObjectStore("userSearch", {
        keyPath: "pubkey",
      });
    }

    if (oldVersion < 5) {
      const v4 = db as unknown as IDBPDatabase<SchemaV4>;
      const v5 = db as unknown as IDBPDatabase<SchemaV5>;

      // migrate accounts table
      const objectStore = transaction.objectStore("accounts");

      objectStore.getAll().then((accounts: SchemaV4["accounts"]["value"][]) => {
        for (const account of accounts) {
          const newAccount: SchemaV5["accounts"] = {
            ...account,
            connectionType: account.useExtension ? "extension" : undefined,
          };
          // @ts-ignore
          delete newAccount.useExtension;

          objectStore.put(newAccount);
        }
      });
    }
  },
});

log("Open");

export async function clearCacheData() {
  log("Clearing replaceableEvents");
  await db.clear("replaceableEvents");

  log("Clearing userSearch");
  await db.clear("userSearch");

  log("Clearing relayInfo");
  await db.clear("relayInfo");

  log("Clearing dnsIdentifiers");
  await db.clear("dnsIdentifiers");

  log("Clearing relayScoreboardStats");
  await db.clear("relayScoreboardStats");

  window.location.reload();
}

export async function deleteDatabase() {
  log("Closing");
  db.close();
  log("Deleting");
  await deleteDB(dbName);
  window.location.reload();
}

if (import.meta.env.DEV) {
  // @ts-ignore
  window.db = db;
}

export default db;
