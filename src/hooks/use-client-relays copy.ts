import { useAsync } from "react-use";
import relayInfoService from "../services/relay-info";

export function useRelayInfo(relay: string) {
  const { value: info, loading, error } = useAsync(() => relayInfoService.getInfo(relay));

  return { info, loading, error };
}
