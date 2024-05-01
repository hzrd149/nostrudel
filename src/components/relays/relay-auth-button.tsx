import { useCallback, useEffect, useState } from "react";
import { AbstractRelay } from "nostr-tools";
import { Button, useToast } from "@chakra-ui/react";

import relayPoolService from "../../services/relay-pool";
import { useSigningContext } from "../../providers/global/signing-provider";

export default function RelayAuthButton({ relay }: { relay: string | URL | AbstractRelay }) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const r = relayPoolService.getRelay(relay);
  if (!r) return null;

  // @ts-expect-error
  const [challenge, setChallenge] = useState(r.challenge ?? "");
  useEffect(() => {
    const sub = relayPoolService.onRelayChallenge.subscribe(([relay, challenge]) => {
      if (r === relay) setChallenge(challenge);
    });

    return () => sub.unsubscribe();
  }, [r]);

  const [loading, setLoading] = useState(false);
  const auth = useCallback(async () => {
    setLoading(true);
    try {
      const message = await r.auth(requestSignature);
      toast({ description: message || "Success", status: "success" });
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
    setLoading(false);
  }, [r, requestSignature]);

  if (challenge)
    return (
      <Button onClick={auth} isLoading={loading}>
        Authenticate
      </Button>
    );
  return null;
}
