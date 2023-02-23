import { decodeText } from "./bech32";

export function isLNURL(lnurl: string) {
  try {
    const parsed = decodeText(lnurl);
    return parsed.prefix.toLowerCase() === "lnurl";
  } catch (e) {
    return false;
  }
}

export function parseLub16Address(address: string) {
  let [name, domain] = address.split("@");
  if (!name || !domain) return;
  return `https://${domain}/.well-known/lnurlp/${name}`;
}

export function parseLNURL(lnurl: string) {
  const { text, prefix } = decodeText(lnurl);

  return prefix === "lnurl" ? text : undefined;
}

export function getLudEndpoint(addressOrLNURL: string) {
  if (addressOrLNURL.includes("@")) {
    return parseLub16Address(addressOrLNURL);
  }
  return parseLNURL(addressOrLNURL);
}
