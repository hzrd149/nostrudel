import { Button, ButtonProps } from "@chakra-ui/react";
import { mergeRelaySets } from "applesauce-core/helpers";
import { useActiveAccount, useEventModel, useObservableState } from "applesauce-react/hooks";
import { useMemo } from "react";

import { RelayIcon } from "../../../../components/icons";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import { connections$ } from "../../../../services/pool";
import { DirectMessageRelays } from "../../../../models/messages";

export default function DirectMessageRelayConnectionsButton({
  other,
  ...props
}: Omit<ButtonProps, "children" | "colorScheme"> & { other: string }) {
  const account = useActiveAccount()!;
  const otherInboxes = useUserInbox(other);
  const selfInboxes = useUserInbox(account.pubkey);

  const legacyRelays = useMemo(() => mergeRelaySets(selfInboxes, otherInboxes), [selfInboxes, otherInboxes]);
  const messageInboxes = useEventModel(DirectMessageRelays, [account.pubkey]);
  const allRelays = useMemo(() => mergeRelaySets(legacyRelays, messageInboxes), [legacyRelays, messageInboxes]);

  const connections = useObservableState(connections$) ?? {};

  const color = useMemo(() => {
    if (!messageInboxes && !selfInboxes) return "red";
    if (!otherInboxes) return "yellow";
    if (allRelays.some((url) => connections[url] === "connected") === false) return "yellow";

    return "green";
  }, [allRelays, connections, otherInboxes, selfInboxes, messageInboxes]);

  const connected = useMemo(
    () => allRelays.reduce((acc, relay) => acc + (connections[relay] === "connected" ? 1 : 0), 0),
    [allRelays, connections],
  );

  return (
    <Button colorScheme={color} leftIcon={<RelayIcon />} {...props}>
      {connected} / {allRelays.length}
    </Button>
  );
}
