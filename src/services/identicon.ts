import Identicon from "identicon.js";

export async function getIdenticon(pubkey: string) {
  if (pubkey.length < 15) return "";

  const svg = new Identicon(pubkey, { format: "svg" }).toString();
  return svg;
}
