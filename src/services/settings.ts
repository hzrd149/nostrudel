import { BehaviorSubject } from "rxjs";
import db from "./db";
import { SavedIdentity } from "./identity";

function log(message: string) {
  console.log(`Settings: ${message}`);
}

const settings = {
  relays: new BehaviorSubject<string[]>([]),
  identity: new BehaviorSubject<SavedIdentity | null>(null),
};

async function loadSettings() {
  let loading = true;

  // load
  const relays = await db.get("settings", "relays");
  if (relays) settings.relays.next(relays);
  const identity = await db.get("settings", "identity");
  if (identity) settings.identity.next(identity);

  // save
  settings.relays.subscribe((newUrls) => {
    if (loading) return;
    db.put("settings", newUrls, "relays");
  });
  settings.identity.subscribe((newIdentity) => {
    if (loading) return;
    db.put("settings", newIdentity, "identity");
  });

  loading = false;
  log("loaded");
}
await loadSettings();

export default settings;
