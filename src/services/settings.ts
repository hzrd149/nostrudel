import { PersistentSubject } from "../classes/subject";
import db from "./db";
import { Account } from "./account";

export enum LightningPayMode {
  Prompt = "prompt",
  Webln = "webln",
  External = "external",
}

const settings = {
  blurImages: new PersistentSubject(true),
  autoShowMedia: new PersistentSubject(true),
  proxyUserMedia: new PersistentSubject(false),
  showReactions: new PersistentSubject(true),
  showSignatureVerification: new PersistentSubject(false),
  accounts: new PersistentSubject<Account[]>([]),
  lightningPayMode: new PersistentSubject<LightningPayMode>(LightningPayMode.Prompt),
  zapAmounts: new PersistentSubject<number[]>([50, 200, 500, 1000]),
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
