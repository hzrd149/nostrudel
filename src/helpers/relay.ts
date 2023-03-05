import { RelayConfig } from "../classes/relay";
import { safeRelayUrl } from "./url";

export function normalizeRelayConfigs(relays: RelayConfig[]) {
  return relays.reduce((newArr, r) => {
    const safeUrl = safeRelayUrl(r.url);
    if (safeUrl) {
      newArr.push({ ...r, url: safeUrl });
    }
    return newArr;
  }, [] as RelayConfig[]);
}
