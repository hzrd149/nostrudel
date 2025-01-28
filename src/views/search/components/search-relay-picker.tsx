import { forwardRef } from "react";
import { Select, SelectProps } from "@chakra-ui/react";
import { AbstractRelay } from "nostr-tools/abstract-relay";

import useSearchRelays from "../../../hooks/use-search-relays";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import WasmRelay from "../../../services/wasm-relay";
import relayPoolService from "../../../services/relay-pool";
import useCacheRelay from "../../../hooks/use-cache-relay";

export function useSearchRelay(relay?: string) {
  const cacheRelay = useCacheRelay();
  if (!relay) return undefined;
  if (relay === "local") return cacheRelay as AbstractRelay;
  else return relayPoolService.requestRelay(relay);
}

const SearchRelayPicker = forwardRef<any, Omit<SelectProps, "children">>(({ value, onChange, ...props }, ref) => {
  const searchRelays = useSearchRelays();
  const cacheRelay = useCacheRelay();

  const { info: cacheRelayInfo } = useRelayInfo(cacheRelay instanceof AbstractRelay ? cacheRelay : undefined, true);
  const localSearchSupported =
    cacheRelay instanceof WasmRelay ||
    (cacheRelay instanceof AbstractRelay && !!cacheRelayInfo?.supported_nips?.includes(50));

  return (
    <Select ref={ref} w="auto" value={value} onChange={onChange} {...props}>
      {localSearchSupported && <option value="local">Local Relay</option>}
      {searchRelays.map((url) => (
        <option key={url} value={url}>
          {url}
        </option>
      ))}
    </Select>
  );
});
export default SearchRelayPicker;
