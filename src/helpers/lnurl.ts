import { decodeText } from "./bech32";
import { parsePaymentRequest } from "./bolt11";

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
  try {
    return parseLNURL(addressOrLNURL);
  } catch (e) {}
}

export async function getInvoiceFromCallbackUrl(callback: URL) {
  const amount = callback.searchParams.get("amount");
  if (!amount) throw new Error("Missing amount");

  const { pr: payRequest } = await fetch(callback).then((res) => res.json());

  if (payRequest as string) {
    const parsed = parsePaymentRequest(payRequest);
    if (parsed.amount !== parseInt(amount)) throw new Error("Incorrect amount");

    return payRequest as string;
  } else throw new Error("Failed to get invoice");
}
