import Identicon from "identicon.js";
import db from "./db";

export async function getIdenticon(pubkey: string) {
  if (pubkey.length < 15) return "";

  // const cached = await db.get("identicon", pubkey);
  // if (cached) return cached;

  const svg = new Identicon(pubkey, { format: "svg" }).toString();
  await db.put("identicon", svg, pubkey);
  return svg;
}
