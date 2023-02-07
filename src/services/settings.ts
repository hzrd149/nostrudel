import db from "./db";

export async function getRelays(): Promise<string[]> {
  return await db.get("settings", "relays");
}
export async function setRelays(relays: string[] = []) {
  await db.put("settings", relays, "relays");
}

const settingsService = {
  getRelays,
  setRelays,
};

if (import.meta.env.DEV) {
  // @ts-ignore
  window.settingsService = settingsService;
}

export default settingsService;
