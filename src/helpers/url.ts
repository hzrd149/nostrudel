export const convertToUrl = (url: string | URL) => (url instanceof URL ? url : new URL(url));

export function normalizeRelayUrl(relayUrl: string) {
  const url = new URL(relayUrl);

  if (relayUrl.includes(",ws")) throw new Error("Can not have multiple relays in one string");

  if (url.protocol !== "wss:" && url.protocol !== "ws:") throw new Error("Incorrect protocol");

  url.pathname = url.pathname.replace(/\/+/g, "/");
  if (url.pathname.endsWith("/")) url.pathname = url.pathname.slice(0, -1);
  if ((url.port === "80" && url.protocol === "ws:") || (url.port === "443" && url.protocol === "wss:")) url.port = "";
  url.searchParams.sort();
  url.hash = "";

  return url.origin + (url.pathname === "/" ? "" : url.pathname) + url.search;
}

export function safeRelayUrl(relayUrl: string) {
  try {
    return normalizeRelayUrl(relayUrl);
  } catch (e) {}
  return null;
}

export function safeRelayUrls(urls: string[]): string[] {
  return urls.map(safeRelayUrl).filter(Boolean) as string[];
}

export function replaceDomain(url: string | URL, replacementUrl: string | URL) {
  const newUrl = new URL(url);
  replacementUrl = convertToUrl(replacementUrl);
  newUrl.host = replacementUrl.host;
  newUrl.protocol = replacementUrl.protocol;
  if (replacementUrl.port) newUrl.port = replacementUrl.port;
  if (replacementUrl.username) newUrl.username = replacementUrl.username;
  if (replacementUrl.password) newUrl.password = replacementUrl.password;
  return newUrl;
}
