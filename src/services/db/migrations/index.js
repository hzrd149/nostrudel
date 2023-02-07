const MIGRATIONS = [
  // 0 -> 1
  function (db, transaction, event) {
    const userMetadata = db.createObjectStore("user-metadata", {
      keyPath: "pubkey",
    });
    userMetadata.createIndex("id", "id", { unique: true });

    const eventsSeen = db.createObjectStore("events-seen", { keyPath: "id" });
    eventsSeen.createIndex("lastSeen", "lastSeen");

    db.createObjectStore("contacts", {
      keyPath: "pubkey",
    });

    // setup data
    const settings = db.createObjectStore("settings");
    settings.put(["wss://nostr.rdfriedl.com"], "relays");
  },
];

export function upgrade(db, oldVersion, newVersion, transaction, event) {
  for (let i = oldVersion; i <= newVersion; i++) {
    if (MIGRATIONS[i]) {
      console.log(`Running database migration ${i}`);
      MIGRATIONS[i](db, transaction, event);
    }
  }
}
