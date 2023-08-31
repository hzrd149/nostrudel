import { unique } from "../helpers/array";
import clientRelaysService from "../services/client-relays";
import { RelayMode } from "../classes/relay";
import useSubject from "./use-subject";

export function useClientRelays(mode: RelayMode = RelayMode.ALL) {
  const relays = useSubject(clientRelaysService.relays) ?? [];

  return relays.filter((r) => r.mode & mode);
}
export function useReadRelayUrls(additional: string[] = []) {
  const relays = useClientRelays(RelayMode.READ);

  const urls = relays.map((r) => r.url);
  if (additional) {
    return unique([...urls, ...additional]);
  }
  return urls;
}

export function useWriteRelayUrls(additional: string[] = []) {
  const relays = useClientRelays(RelayMode.WRITE);

  const urls = relays.map((r) => r.url);
  if (additional) {
    return unique([...urls, ...additional]);
  }
  return urls;
}
