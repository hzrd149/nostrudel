import appSettings from "../services/settings/app-settings";
import { convertToUrl } from "./url";

const corsFailedHosts = new Set();

export function fetchWithCorsFallback(url: URL | string, opts?: RequestInit) {
  if (!appSettings.value.corsProxy) return fetch(url, opts);

  if (corsFailedHosts.has(convertToUrl(url).host)) {
    return fetch(appSettings.value.corsProxy + url, opts);
  }

  return fetch(url, opts).catch((e) => {
    corsFailedHosts.add(convertToUrl(url).host);
    return fetch(appSettings.value.corsProxy + url, opts);
  });
}
