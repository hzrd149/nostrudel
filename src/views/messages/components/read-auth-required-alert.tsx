import { LockIcon } from "@chakra-ui/icons";
import { Alert, AlertProps, Button, Flex, Text } from "@chakra-ui/react";
import { firstValueFrom } from "rxjs";
import useAsyncAction from "../../../hooks/use-async-action";
import useMessaging from "../../../hooks/use-messaging";
import useMessageAlerts from "../../../hooks/use-message-alerts";

export default function ReadAuthRequiredAlert({ relays: _relays, ...props }: { relays?: string[] } & AlertProps) {
  const session = useMessaging();
  const { requests, errors, startupError } = useMessageAlerts();
  const authenticate = useAsyncAction(async () => {
    if (!session) return;
    const results = [...(await session.legacy.authenticateAll()), ...(await session.wrapped.authenticateAll())];
    const failed = results.filter((result) => result.status === "failed");
    if (failed.length) throw new Error(`Authentication failed: ${failed.map((result) => result.url).join(", ")}`);
  }, [session]);
  const one = useAsyncAction(
    async (url: string) => {
      if (!session) return;
      for (const client of [session.legacy, session.wrapped]) {
        if ((await firstValueFrom(client.authRequests$)).some((request) => request.url === url))
          await client.authenticate(url);
      }
    },
    [session],
  );
  if (!requests.length && !errors.length && !startupError) return null;
  return (
    <Alert status="warning" {...props}>
      <Flex gap="2" alignItems="center" flexWrap="wrap" w="full">
        {startupError && <Text w="full">{startupError}</Text>}
        {errors.map((error) => (
          <Text key={error} w="full">
            {error}
          </Text>
        ))}
        {!!errors.length && <Button onClick={() => session?.errors$.next([])}>Dismiss errors</Button>}
        {requests.map((request) => (
          <Flex key={request.url} gap="2" align="center" w="full" wrap="wrap">
            <Text overflowWrap="anywhere" flex="1">
              {request.url}
              {request.error ? `: ${String(request.error)}` : ""}
            </Text>
            <Button onClick={() => one.run(request.url)} isLoading={request.state === "authenticating"}>
              {request.state === "failed" ? "Retry authentication" : "Authenticate relay"}
            </Button>
          </Flex>
        ))}
        {!!requests.length && (
          <Button leftIcon={<LockIcon boxSize={5} />} onClick={authenticate.run} isLoading={authenticate.loading}>
            Authenticate
          </Button>
        )}
      </Flex>
    </Alert>
  );
}
