import { ChangeEventHandler } from "react";
import { Switch, useInterval, useToast } from "@chakra-ui/react";
import { type AbstractRelay } from "nostr-tools/abstract-relay";
import { useObservable } from "applesauce-react/hooks";

import relayPoolService from "../../services/relay-pool";
import useForceUpdate from "../../hooks/use-force-update";

export default function RelayConnectSwitch({ relay }: { relay: string | URL | AbstractRelay }) {
  const toast = useToast();

  const r = relayPoolService.getRelay(relay);
  if (!r) return null;

  const update = useForceUpdate();
  useInterval(update, 500);

  const connecting = useObservable(relayPoolService.connecting.get(r));

  const onChange: ChangeEventHandler<HTMLInputElement> = async (e) => {
    try {
      if (e.target.checked && !r.connected) await relayPoolService.requestConnect(r);
      else if (r.connected) r.close();
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  };

  return (
    <Switch
      isDisabled={connecting}
      isChecked={r.connected || connecting}
      onChange={onChange}
      colorScheme={r.connected ? "green" : "red"}
    />
  );
}
