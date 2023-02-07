import db from "./db";

export async function getRelays() {
  return await db.get("settings", "relays");
}
export async function setRelays(relays = []) {
  return await db.put("settings", relays, "relays");
}

const settingsService = {
  getRelays,
  setRelays,
};

if (import.meta.env.DEV) {
  window.settingsService = settingsService;
}

export default settingsService;
