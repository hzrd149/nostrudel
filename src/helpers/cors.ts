import appSettings from "../services/settings/app-settings";
import { convertToUrl } from "./url";

const corsFailedHosts = new Set();

export function createCorsUrl(url: URL | string, corsProxy = appSettings.value.corsProxy) {
  if (!corsProxy) return url;

  if (corsProxy.includes("<url>")) {
    return corsProxy.replace("<url>", "" + url);
  } else if (corsProxy.includes("<encoded_url>")) {
    return corsProxy.replace("<encoded_url>", encodeURIComponent("" + url));
  } else {
    return corsProxy.endsWith("/") ? corsProxy + url : corsProxy + "/" + url;
  }
}

export function fetchWithCorsFallback(url: URL | string, opts?: RequestInit) {
  if (!appSettings.value.corsProxy) return fetch(url, opts);

  if (corsFailedHosts.has(convertToUrl(url).host)) {
    return fetch(createCorsUrl(url), opts);
  }

  return fetch(url, opts).catch((e) => {
    corsFailedHosts.add(convertToUrl(url).host);
    return fetch(createCorsUrl(url), opts);
  });
}
