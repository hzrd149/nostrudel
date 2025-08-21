import { EMPTY, switchMap } from "rxjs";
import { AppSettingsQuery } from "../models";
import accounts from "../services/accounts";
import { eventStore } from "../services/event-store";
import { type AppSettings } from "./app-settings";
import { convertToUrl } from "./url";

// hack to get app settings
let settings: AppSettings | undefined;
accounts.active$
  .pipe(switchMap((account) => (account ? eventStore.model(AppSettingsQuery, account.pubkey) : EMPTY)))
  .subscribe((v) => (settings = v));

const clearNetFailedHosts = new Set();
const proxyFailedHosts = new Set();

export function createRequestProxyUrl(url: URL | string, corsProxy?: string) {
  if (!corsProxy && window.REQUEST_PROXY) corsProxy = new URL(window.REQUEST_PROXY, location.origin).toString();
  if (!corsProxy && settings?.corsProxy) corsProxy = settings.corsProxy;
  if (!corsProxy) return url;

  if (corsProxy.includes("<url>")) {
    return corsProxy.replace("<url>", "" + url);
  } else if (corsProxy.includes("<encoded_url>")) {
    return corsProxy.replace("<encoded_url>", encodeURIComponent("" + url));
  } else {
    return corsProxy.endsWith("/") ? corsProxy + url : corsProxy + "/" + url;
  }
}

export function fetchWithProxy(url: URL | string, opts?: RequestInit) {
  if (!settings?.corsProxy && !window.REQUEST_PROXY) return fetch(url, opts);

  const u = typeof url === "string" ? convertToUrl(url) : url;

  // if its an onion domain try the request proxy first
  if ((u.host.endsWith(".onion") || u.host.endsWith(".i2p")) && !proxyFailedHosts.has(u.host)) {
    return fetch(createRequestProxyUrl(url), opts).catch((e) => {
      proxyFailedHosts.add(u.host);
      return fetch(url, opts);
    });
  }

  // if the clear net request has failed. use the proxy
  if (clearNetFailedHosts.has(u.host)) {
    return fetch(createRequestProxyUrl(url), opts);
  }

  // try clear net first and fallback to request proxy
  return fetch(url, opts).catch((e) => {
    clearNetFailedHosts.add(u.host);
    return fetch(createRequestProxyUrl(url), opts);
  });
}
