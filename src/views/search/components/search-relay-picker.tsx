import { forwardRef } from "react";
import { Select, SelectProps } from "@chakra-ui/react";
import { AbstractRelay } from "nostr-tools/abstract-relay";

import useSearchRelays from "../../../hooks/use-search-relays";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import { localRelay } from "../../../services/local-relay";
import WasmRelay from "../../../services/wasm-relay";
import relayPoolService from "../../../services/relay-pool";

export function useSearchRelay(relay?: string) {
  if (!relay) return undefined;
  if (relay === "local") return localRelay as AbstractRelay;
  else return relayPoolService.requestRelay(relay);
}

const SearchRelayPicker = forwardRef<any, Omit<SelectProps, "children">>(({ value, onChange, ...props }) => {
  const searchRelays = useSearchRelays();
  const { info: localRelayInfo } = useRelayInfo(localRelay instanceof AbstractRelay ? localRelay : undefined, true);
  const localSearchSupported =
    localRelay instanceof WasmRelay ||
    (localRelay instanceof AbstractRelay && !!localRelayInfo?.supported_nips?.includes(50));

  return (
    <Select w="auto" value={value} onChange={onChange} {...props}>
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
