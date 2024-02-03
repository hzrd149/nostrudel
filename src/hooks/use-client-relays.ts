import clientRelaysService from "../services/client-relays";
import useSubject from "./use-subject";

export function useReadRelays(additional?: Iterable<string>) {
  const set = useSubject(clientRelaysService.readRelays);
  if (additional) return set.clone().merge(additional);
  return set;
}
export function useWriteRelays(additional?: Iterable<string>) {
  const set = useSubject(clientRelaysService.writeRelays);
  if (additional) return set.clone().merge(additional);
  return set;
}
