import { Select, SelectProps } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import { RelayAuthMode } from "../../classes/relay-pool";
import localSettings from "../../services/local-settings";

export default function RelayAuthModeSelect({
  relay,
  ...props
}: { relay: string } & Omit<SelectProps, "value" | "onChange" | "children">) {
  const defaultMode = useObservable(localSettings.defaultAuthenticationMode);
  const relayMode = useObservable(localSettings.relayAuthenticationMode);

  const authMode = relayMode.find((r) => r.relay === relay)?.mode ?? "";

  const setAuthMode = (mode: RelayAuthMode | "") => {
    const existing = relayMode.find((r) => r.relay === relay);

    if (!mode) {
      if (existing) localSettings.relayAuthenticationMode.next(relayMode.filter((r) => r.relay !== relay));
    } else {
      if (existing)
        localSettings.relayAuthenticationMode.next(relayMode.map((r) => (r.relay === relay ? { relay, mode } : r)));
      else localSettings.relayAuthenticationMode.next([...relayMode, { relay, mode }]);
    }
  };

  return (
    <Select value={authMode} onChange={(e) => setAuthMode(e.target.value as RelayAuthMode)} {...props}>
      <option value="">Default ({defaultMode})</option>
      <option value="always">Always</option>
      <option value="ask">Ask</option>
      <option value="never">Never</option>
    </Select>
  );
}
