import { useObservable } from "applesauce-react/hooks";
import clientRelaysService from "../services/client-relays";

export function useReadRelays(additional?: Iterable<string>) {
  const readRelays = useObservable(clientRelaysService.readRelays);
  if (additional) return readRelays.clone().merge(additional);
  return readRelays;
}
export function useWriteRelays(additional?: Iterable<string>) {
  const writeRelays = useObservable(clientRelaysService.writeRelays);
  if (additional) return writeRelays.clone().merge(additional);
  return writeRelays;
}
