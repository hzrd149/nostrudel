const MIGRATIONS = [
  // 0 -> 1
  function (db, transaction, event) {
    db.createObjectStore("users", {
      keyPath: "pubkey",
    });
    db.createObjectStore("contacts", {
      keyPath: "pubkey",
    });
    db.createObjectStore("settings");

    // setup data
    const settings = transaction.objectStore("settings");
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
