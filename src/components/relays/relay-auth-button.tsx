import { useCallback, useState } from "react";
import { IconButton, IconButtonProps, useForceUpdate, useInterval, useToast } from "@chakra-ui/react";
import { type AbstractRelay } from "nostr-tools/abstract-relay";

import relayPoolService from "../../services/relay-pool";
import { useSigningContext } from "../../providers/global/signing-provider";
import PasscodeLock from "../icons/passcode-lock";
import useSubject from "../../hooks/use-subject";
import CheckCircleBroken from "../icons/check-circle-broken";

export function useRelayChallenge(relay: AbstractRelay) {
  return useSubject(relayPoolService.challenges.get(relay));
}

export function useRelayAuthMethod(relay: AbstractRelay) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const challenge = useRelayChallenge(relay);

  const authenticated = useSubject(relayPoolService.authenticated.get(relay));

  const [loading, setLoading] = useState(false);
  const auth = useCallback(async () => {
    setLoading(true);
    try {
      const message = await relayPoolService.authenticate(relay, requestSignature, false);
      toast({ description: message || "Success", status: "success" });
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
    setLoading(false);
  }, [relay, requestSignature]);

  return { loading, auth, challenge, authenticated };
}

export function IconRelayAuthButton({
  relay,
  ...props
}: { relay: string | URL | AbstractRelay } & Omit<IconButtonProps, "icon" | "aria-label" | "title">) {
  const r = relayPoolService.getRelay(relay);
  if (!r) return null;

  const update = useForceUpdate();
  useInterval(update, 500);

  const { challenge, auth, loading, authenticated } = useRelayAuthMethod(r);

  if (authenticated) {
    return (
      <IconButton
        icon={<CheckCircleBroken boxSize={6} />}
        aria-label="Authenticated"
        title="Authenticated"
        colorScheme="green"
        {...props}
      />
    );
  }

  if (r.connected && challenge) {
    return (
      <IconButton
        icon={<PasscodeLock boxSize={6} />}
        onClick={auth}
        isLoading={loading}
        aria-label="Authenticate with relay"
        title="Authenticate"
        {...props}
      />
    );
  }

  return null;
}
