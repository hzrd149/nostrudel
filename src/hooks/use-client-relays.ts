import { useObservableEagerState } from "applesauce-react/hooks";
import { unique } from "../helpers/array";
import localSettings from "../services/preferences";

export function useReadRelays(additional?: Iterable<string>) {
  const relays = useObservableEagerState(localSettings.fallbackRelays);
  if (additional) return unique([...relays, ...additional]);
  else return relays;
}
export function useWriteRelays(additional?: Iterable<string>) {
  const relays = useObservableEagerState(localSettings.extraPublishRelays);
  if (additional) return unique([...relays, ...additional]);
  else return relays;
}
