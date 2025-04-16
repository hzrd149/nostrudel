import { useAsync } from "react-use";

import relayInfoService from "../services/relay-info";

export function useRelayInfo(relay?: string, alwaysFetch = false) {
  const {
    value: info,
    loading,
    error,
  } = useAsync(async () => {
    if (relay) return await relayInfoService.getInfo(relay, alwaysFetch);
    else return undefined;
  }, [relay]);

  return { info, loading, error };
}
