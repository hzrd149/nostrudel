import { CORS_TEST_URL } from "../const";

/** The NIP-05 document location for a name at a domain */
export function getNip05WellKnownUrl(name: string, domain: string): string {
  // aislop-ignore-next-line ai-slop/hardcoded-url -- NIP-05 fixes this location as https://<domain>/.well-known/nostr.json?name=<name>; the host is the identifier's own domain, so there is nothing to configure
  return `https://${domain}/.well-known/nostr.json?name=${name}`;
}

/** A cors-test link that requests target with GET and reports its CORS headers */
export function getCorsTestUrl(target: string): string {
  return `${CORS_TEST_URL}?url=${encodeURIComponent(target)}&method=get`;
}
