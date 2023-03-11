import { RelayConfig } from "../classes/relay";
import { safeRelayUrl } from "./url";

export function normalizeRelayConfigs(relays: RelayConfig[]) {
  const seen: string[] = [];
  return relays.reduce((newArr, r) => {
    const safeUrl = safeRelayUrl(r.url);
    if (safeUrl && !seen.includes(safeUrl)) {
      seen.push(safeUrl);
      newArr.push({ ...r, url: safeUrl });
    }
    return newArr;
  }, [] as RelayConfig[]);
}
