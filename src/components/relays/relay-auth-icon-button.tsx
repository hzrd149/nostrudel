import { useCallback } from "react";
import { IconButton, IconButtonProps, useToast } from "@chakra-ui/react";

import PasscodeLock from "../icons/passcode-lock";
import authenticationSigner from "../../services/authentication-signer";
import useRelayAuthState from "../../hooks/use-relay-auth-state";
import CheckCircleBroken from "../icons/check-circle-broken";

export function RelayAuthIconButton({
  relay,
  ...props
}: { relay: string } & Omit<IconButtonProps, "icon" | "aria-label" | "title">) {
  const toast = useToast();
  const authState = useRelayAuthState(relay);

  const authenticate = useCallback(async () => {
    try {
      await authenticationSigner.authenticate(relay);
      toast({ description: "Success", status: "success" });
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  }, [relay]);

  switch (authState?.status) {
    case "success":
      return (
        <IconButton
          icon={<CheckCircleBroken boxSize={6} />}
          aria-label="Authenticated"
          title="Authenticated"
          colorScheme="green"
          {...props}
        />
      );
    case "signing":
    case "requested":
      return (
        <IconButton
          icon={<PasscodeLock boxSize={6} />}
          onClick={authenticate}
          isLoading={authState.status === "signing"}
          aria-label="Authenticate with relay"
          title="Authenticate"
          {...props}
        />
      );

    default:
      return null;
  }
}
