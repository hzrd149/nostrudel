import { openDB, deleteDB, IDBPDatabase, IDBPTransaction } from "idb";
import { clearDB } from "nostr-idb";

import { SchemaV1, SchemaV2, SchemaV3, SchemaV4, SchemaV5, SchemaV6, SchemaV7 } from "./schema";
import { logger } from "../../helpers/debug";
import { localCacheDatabase } from "../local-cache-relay";

const log = logger.extend("Database");

const dbName = "storage";
const version = 7;
const db = await openDB<SchemaV6>(dbName, version, {
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
      const trans = transaction as unknown as IDBPTransaction<SchemaV1, string[], "versionchange">;
      const v2 = db as unknown as IDBPDatabase<SchemaV2>;

      // rename the old settings object store to misc
      const oldSettings = trans.objectStore("settings");
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
      v2.deleteObjectStore("userMetadata");
      v2.deleteObjectStore("userContacts");
      v2.deleteObjectStore("userRelays");
      v2.deleteObjectStore("settings");

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
      const trans = transaction as unknown as IDBPTransaction<SchemaV5, string[], "versionchange">;

      // migrate accounts table
      const objectStore = trans.objectStore("accounts");

      objectStore.getAll().then((accounts: SchemaV4["accounts"]["value"][]) => {
        for (const account of accounts) {
          const newAccount: SchemaV5["accounts"]["value"] = {
            ...account,
            connectionType: account.useExtension ? "extension" : undefined,
          };
          // @ts-ignore
          delete newAccount.useExtension;

          objectStore.put(newAccount);
        }
      });
    }

    if (oldVersion < 6) {
      const v6 = db as unknown as IDBPDatabase<SchemaV6>;

      // create new search table
      const channelMetadata = v6.createObjectStore("channelMetadata", {
        keyPath: "channelId",
      });
      channelMetadata.createIndex("created", "created");
    }

    if (oldVersion < 7) {
      const transV6 = transaction as unknown as IDBPTransaction<SchemaV6, string[], "versionchange">;
      const transV7 = transaction as unknown as IDBPTransaction<SchemaV7, string[], "versionchange">;

      const accounts = transV7.objectStore("accounts");

      transV6
        .objectStore("accounts")
        .getAll()
        .then((oldAccounts: SchemaV6["accounts"]["value"][]) => {
          for (const account of oldAccounts) {
            if (account.secKey && account.iv) {
              // migrate local accounts
              accounts.put({
                type: "local",
                pubkey: account.pubkey,
                secKey: account.secKey,
                iv: account.iv,
                readonly: false,
                relays: account.relays,
              } satisfies SchemaV7["accounts"]["value"]);
            } else if (account.readonly) {
              // migrate readonly accounts
              accounts.put({
                type: "pubkey",
                pubkey: account.pubkey,
                readonly: true,
                relays: account.relays,
              } satisfies SchemaV7["accounts"]["value"]);
            } else if (
              account.connectionType === "serial" ||
              account.connectionType === "amber" ||
              account.connectionType === "extension"
            ) {
              // migrate extension, serial, amber accounts
              accounts.put({
                type: account.connectionType,
                pubkey: account.pubkey,
                readonly: false,
                relays: account.relays,
              } satisfies SchemaV7["accounts"]["value"]);
            }
          }
        });
    }
  },
});

log("Open");

export async function clearCacheData() {
  log("Clearing nostr-idb");
  await clearDB(localCacheDatabase);

  log("Clearing replaceableEvents");
  await db.clear("replaceableEvents");

  log("Clearing channelMetadata");
  await db.clear("channelMetadata");

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
  await deleteDB("events");
  window.location.reload();
}

if (import.meta.env.DEV) {
  // @ts-ignore
  window.db = db;
}

export default db;
