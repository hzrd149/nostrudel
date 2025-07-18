import { Select, SelectProps } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";

import { RelayAuthMode } from "../../services/authentication-signer";
import localSettings from "../../services/preferences";

export function setRelayAuthMode(relay: string, mode: RelayAuthMode | null) {
  const modes = localSettings.relayAuthenticationMode.value;

  const existing = modes.find((r) => r.relay === relay);
  if (!mode) {
    if (existing) localSettings.relayAuthenticationMode.next(modes.filter((r) => r.relay !== relay));
  } else {
    if (existing)
      localSettings.relayAuthenticationMode.next(modes.map((r) => (r.relay === relay ? { relay, mode } : r)));
    else localSettings.relayAuthenticationMode.next([...modes, { relay, mode }]);
  }
}

export default function RelayAuthModeSelect({
  relay,
  ...props
}: { relay: string } & Omit<SelectProps, "value" | "onChange" | "children">) {
  const defaultMode = useObservableEagerState(localSettings.defaultAuthenticationMode);
  const relayMode = useObservableEagerState(localSettings.relayAuthenticationMode);

  const authMode = relayMode.find((r) => r.relay === relay)?.mode ?? "";

  const setAuthMode = (mode: RelayAuthMode | "") => {
    setRelayAuthMode(relay, mode || null);
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
