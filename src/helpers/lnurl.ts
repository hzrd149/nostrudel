import { decodeText } from "./bech32";

export function isLNURL(lnurl: string) {
  try {
    const parsed = decodeText(lnurl);
    return parsed.prefix.toLowerCase() === "lnurl";
  } catch (e) {
    return false;
  }
}
