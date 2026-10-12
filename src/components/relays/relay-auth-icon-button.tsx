import { IconButton, IconButtonProps } from "@chakra-ui/react";
import useAsyncAction from "../../hooks/use-async-action";
import useRelayAuthentication from "../../hooks/use-relay-authentication";

import { use$ } from "applesauce-react/hooks";
import authenticationSigner, { authenticateRelay } from "../../services/authentication-signer";
import pool from "../../services/pool";
import { ErrorIcon } from "../icons";
import CheckCircleBroken from "../icons/check-circle-broken";
import PasscodeLock from "../icons/passcode-lock";

export function RelayAuthIconButton({
  relay,
  ...props
}: { relay: string } & Omit<IconButtonProps, "icon" | "aria-label" | "title">) {
  const connected = use$(() => pool.relay(relay).connected$, [relay]);
  const challenge = use$(() => pool.relay(relay).challenge$, [relay]);
  const { response } = useRelayAuthentication(relay);
  const signing = use$(authenticationSigner.relayState$)?.[relay];

  const authenticate = useAsyncAction(async () => {
    await authenticateRelay(relay);
  }, [relay]);

  // If the relay is not connected or has no challenge, don't show the button
  if (!connected || !challenge) return null;

  switch (response?.ok) {
    case true:
      return (
        <IconButton
          icon={<CheckCircleBroken boxSize={6} />}
          aria-label="Authenticated"
          title="Authenticated"
          colorScheme="green"
          {...props}
        />
      );
    case false:
      return (
        <IconButton
          icon={<ErrorIcon boxSize={6} />}
          onClick={authenticate.run}
          aria-label="Try again"
          title="Failed"
          colorScheme="red"
          {...props}
        />
      );
    default:
      return (
        <IconButton
          icon={<PasscodeLock boxSize={6} />}
          onClick={authenticate.run}
          isLoading={signing?.status === "signing"}
          aria-label="Authenticate with relay"
          title="Authenticate"
          {...props}
        />
      );
  }
}
