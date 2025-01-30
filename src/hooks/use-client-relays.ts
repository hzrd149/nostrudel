import { useObservable } from "applesauce-react/hooks";
import localSettings from "../services/local-settings";
import { unique } from "../helpers/array";

export function useReadRelays(additional?: Iterable<string>) {
  const relays = useObservable(localSettings.readRelays);
  if (additional) return unique([...relays, ...additional]);
  else return relays;
}
export function useWriteRelays(additional?: Iterable<string>) {
  const relays = useObservable(localSettings.writeRelays);
  if (additional) return unique([...relays, ...additional]);
  else return relays;
}
