import { useAsync } from "react-use";
import relayInfoService from "../services/relay-info";

export function useRelayInfo(relay: string, alwaysFetch = false) {
  const { value: info, loading, error } = useAsync(() => relayInfoService.getInfo(relay, alwaysFetch));

  return { info, loading, error };
}
