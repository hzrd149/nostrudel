import { BehaviorSubject } from "rxjs";
import db from "./db";
import { SavedIdentity } from "./identity";

const settings = {
  identity: new BehaviorSubject<SavedIdentity | null>(null),
  blurImages: new BehaviorSubject(true),
  autoShowMedia: new BehaviorSubject(true),
  proxyUserMedia: new BehaviorSubject(false),
};

async function loadSettings() {
  let loading = true;

  // load
  for (const [key, subject] of Object.entries(settings)) {
    const value = await db.get("settings", key);
    if (value !== undefined) subject.next(value);

    // save
    // @ts-ignore
    subject.subscribe((newValue) => {
      if (loading) return;
      db.put("settings", newValue, key);
    });
  }

  loading = false;
}
await loadSettings();

export default settings;
