import { PersistentSubject } from "../classes/subject";
import db from "./db";
import { Account } from "./account";

const settings = {
  blurImages: new PersistentSubject(true),
  autoShowMedia: new PersistentSubject(true),
  proxyUserMedia: new PersistentSubject(false),
  showReactions: new PersistentSubject(true),
  accounts: new PersistentSubject<Account[]>([]),
};

async function loadSettings() {
  let loading = true;

  // load
  for (const [key, subject] of Object.entries(settings)) {
    const value = await db.get("settings", key);
    // @ts-ignore
    if (value !== undefined) subject.next(value);

    // save
    subject.subscribe((newValue) => {
      if (loading) return;
      db.put("settings", newValue, key);
    });
  }

  loading = false;
}
await loadSettings();

export default settings;
