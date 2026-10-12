import { LockIcon } from "@chakra-ui/icons";
import { Alert, AlertProps, Box, Button, ButtonGroup, Flex, Text } from "@chakra-ui/react";
import { useActiveAccount, use$ } from "applesauce-react/hooks";
import { useMemo } from "react";
import { combineLatest } from "rxjs";

import { setRelayAuthMode } from "../../../components/relays/relay-auth-mode-select";
import useAsyncAction from "../../../hooks/use-async-action";
import pool from "../../../services/pool";

export default function ReadAuthRequiredAlert({ relays, ...props }: { relays: string[] } & AlertProps) {
  const account = useActiveAccount();

  const relayState =
    use$(
      () =>
        combineLatest(
          Object.fromEntries(
            relays.map((url) => {
              const relay = pool.relay(url);

              return [
                url,
                combineLatest({
                  required: relay.authRequiredForRead$,
                  authentications: relay.authentications$,
                  connected: relay.connected$,
                  challenge: relay.challenge$,
                }),
              ];
            }),
          ),
        ),
      [relays, account?.pubkey],
    ) ?? {};

  const authRequiredRelays = useMemo(
    () =>
      relays.filter((url) => {
        const state = relayState[url];
        return (
          state?.authentications[account?.pubkey ?? ""]?.response?.ok !== true &&
          state?.required &&
          state?.connected &&
          state?.challenge !== null
        );
      }),
    [relays, relayState, account?.pubkey],
  );

  const authenticateRelays = useAsyncAction(
    async (always = false) => {
      if (!account || !authRequiredRelays.length) return;

      if (always) {
        for (const url of authRequiredRelays) setRelayAuthMode(url, "always");
      }

      // Run authentication in parallel
      await Promise.all(
        authRequiredRelays.map(async (url) => {
          const response = await pool.relay(url).authenticate(account);
          if (!response.ok) throw new Error(`${url}: ${response.message || "Authentication rejected"}`);
        }),
      );
    },
    [authRequiredRelays, account],
  );

  if (!account || authRequiredRelays.length === 0) return null;

  return (
    <Alert status="warning" variant="subtle" flexShrink={0} {...props}>
      <Flex align="center" width="full" flexWrap="wrap">
        <Box overflow="hidden" isTruncated>
          <Text>
            {authRequiredRelays.length} relay{authRequiredRelays.length !== 1 ? "s" : ""} require
            {authRequiredRelays.length === 1 ? "s" : ""} authentication to read messages.
          </Text>
          <Text fontSize="sm" color="GrayText">
            {authRequiredRelays.join(", ")}
          </Text>
        </Box>

        <ButtonGroup ms="auto" size="sm">
          {authenticateRelays.loading === false && (
            <Button variant="ghost" onClick={() => authenticateRelays.run(true)}>
              Always
            </Button>
          )}
          <Button
            leftIcon={<LockIcon boxSize={4} />}
            onClick={() => authenticateRelays.run()}
            isLoading={authenticateRelays.loading}
            colorScheme="green"
            loadingText="Authenticating..."
          >
            Authenticate
          </Button>
        </ButtonGroup>
      </Flex>
    </Alert>
  );
}
