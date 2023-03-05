export function normalizeRelayUrl(relayUrl: string) {
  const url = new URL(relayUrl);

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
