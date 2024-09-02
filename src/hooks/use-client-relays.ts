import clientRelaysService from "../services/client-relays";
import useSubject from "./use-subject";

export function useReadRelays(additional?: Iterable<string>) {
  const readRelays = useSubject(clientRelaysService.readRelays);
  if (additional) return readRelays.clone().merge(additional);
  return readRelays;
}
export function useWriteRelays(additional?: Iterable<string>) {
  const writeRelays = useSubject(clientRelaysService.writeRelays);
  if (additional) return writeRelays.clone().merge(additional);
  return writeRelays;
}
