import { Button, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import { MessageAuthRequest } from "applesauce-extra/messages";
import { useState } from "react";
import { firstValueFrom } from "rxjs";

import RelayFavicon from "../../../../components/relay/relay-favicon";
import RelayLink from "../../../../components/relay/relay-link";
import { setRelayAuthMode } from "../../../../components/relays/relay-auth-mode-select";
import useAsyncAction from "../../../../hooks/use-async-action";
import useMessageAlerts from "../../../../hooks/use-message-alerts";
import useMessaging from "../../../../hooks/use-messaging";

function RelayAuthenticationRow({ request, onDismiss }: { request: MessageAuthRequest; onDismiss: () => void }) {
  const session = useMessaging();
  const authenticate = useAsyncAction(
    async (always: boolean) => {
      if (!session) return;
      if (always) await setRelayAuthMode(request.url, "always");
      for (const client of [session.legacy, session.wrapped]) {
        if ((await firstValueFrom(client.authRequests$)).some(({ url }) => url === request.url)) {
          await client.authenticate(request.url);
        }
      }
    },
    [session, request.url],
  );
  const busy = authenticate.loading || request.state === "authenticating";

  return (
    <VStack align="stretch" spacing="1">
      <Flex align="center" gap="2" wrap="wrap">
        <RelayFavicon relay={request.url} />
        <RelayLink relay={request.url} isTruncated flex="1" minW="0" />
        <Flex gap="2" ms="auto">
          <Button variant="ghost" onClick={onDismiss} isDisabled={busy}>
            Dismiss
          </Button>
          <Button onClick={() => authenticate.run(false)} isDisabled={busy}>
            Once
          </Button>
          <Button colorScheme="primary" onClick={() => authenticate.run(true)} isLoading={busy}>
            Always
          </Button>
        </Flex>
      </Flex>
      {request.error != null && (
        <Text color="red.500" overflowWrap="anywhere">
          {request.error instanceof Error ? request.error.message : String(request.error)}
        </Text>
      )}
    </VStack>
  );
}

export default function RelayAuthentication() {
  const session = useMessaging();
  const { requests } = useMessageAlerts();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const requestKey = (request: MessageAuthRequest) =>
    `${session?.wrapped.pubkey}:${request.url}:${request.context.challenge}`;
  const visible = requests.filter((request) => !dismissed.has(requestKey(request)));
  if (!visible.length) return null;

  return (
    <VStack align="stretch" spacing="3">
      <Heading size="md">Relay authentication</Heading>
      {visible.map((request) => (
        <RelayAuthenticationRow
          key={requestKey(request)}
          request={request}
          onDismiss={() => setDismissed((previous) => new Set(previous).add(requestKey(request)))}
        />
      ))}
    </VStack>
  );
}
