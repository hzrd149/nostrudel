import { Button, ButtonProps } from "@chakra-ui/react";
import { mergeRelaySets } from "applesauce-core/helpers";
import { useActiveAccount, useObservableEagerState } from "applesauce-react/hooks";
import { useMemo } from "react";

import { RelayIcon } from "../../../../components/icons";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import { connections$ } from "../../../../services/pool";

export default function DirectMessageRelayConnectionsButton({
  other,
  ...props
}: Omit<ButtonProps, "children" | "colorScheme"> & { other: string }) {
  const account = useActiveAccount()!;
  const otherInboxes = useUserInbox(other);
  const selfInboxes = useUserInbox(account.pubkey);

  const relays = useMemo(() => mergeRelaySets(selfInboxes, otherInboxes), [selfInboxes, otherInboxes]);
  const connections = useObservableEagerState(connections$);

  const color = useMemo(() => {
    if (!otherInboxes || !selfInboxes) return "red";
    if (relays.some((url) => connections[url] === "connected") === false) return "yellow";

    return "green";
  }, [relays, connections, otherInboxes, selfInboxes]);

  const connected = useMemo(
    () => relays.reduce((acc, relay) => acc + (connections[relay] === "connected" ? 1 : 0), 0),
    [relays, connections],
  );

  return (
    <Button colorScheme={color} leftIcon={<RelayIcon />} {...props}>
      {connected} / {relays.length}
    </Button>
  );
}
