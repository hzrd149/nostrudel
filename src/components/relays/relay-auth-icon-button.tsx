import { IconButton, IconButtonProps, useToast } from "@chakra-ui/react";
import { useCallback } from "react";

import { useObservableEagerMemo, useObservableState } from "applesauce-react/hooks";
import authenticationSigner from "../../services/authentication-signer";
import pool from "../../services/pool";
import { ErrorIcon } from "../icons";
import CheckCircleBroken from "../icons/check-circle-broken";
import PasscodeLock from "../icons/passcode-lock";

export function RelayAuthIconButton({
  relay,
  ...props
}: { relay: string } & Omit<IconButtonProps, "icon" | "aria-label" | "title">) {
  const toast = useToast();
  const connected = useObservableEagerMemo(() => pool.relay(relay).connected$, [relay]);
  const challenge = useObservableEagerMemo(() => pool.relay(relay).challenge$, [relay]);
  const response = useObservableEagerMemo(() => pool.relay(relay).authenticationResponse$, [relay]);
  const signing = useObservableState(authenticationSigner.relayState$)?.[relay];

  const authenticate = useCallback(async () => {
    try {
      await authenticationSigner.authenticate(relay);
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
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
          onClick={authenticate}
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
          onClick={authenticate}
          isLoading={signing?.status === "signing"}
          aria-label="Authenticate with relay"
          title="Authenticate"
          {...props}
        />
      );
  }
}
