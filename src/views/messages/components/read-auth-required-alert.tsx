import { LockIcon } from "@chakra-ui/icons";
import { Alert, AlertProps, Button, Flex, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { combineLatest, map } from "rxjs";
import useAsyncAction from "../../../hooks/use-async-action";
import useMessaging from "../../../hooks/use-messaging";

export default function ReadAuthRequiredAlert({ relays: _relays, ...props }: { relays?: string[] } & AlertProps) {
  const session = useMessaging();
  const errors = use$(() => session?.errors$, [session]) ?? [];
  const requests =
    use$(
      () =>
        session &&
        combineLatest([session.legacy.authRequests$, session.wrapped.authRequests$]).pipe(
          map(([legacy, wrapped]) => [
            ...new Map([...legacy, ...wrapped].map((request) => [request.url, request])).values(),
          ]),
        ),
      [session],
    ) ?? [];
  const authenticate = useAsyncAction(async () => {
    if (!session) return;
    const results = [...(await session.legacy.authenticateAll()), ...(await session.wrapped.authenticateAll())];
    const failed = results.filter((result) => result.status === "failed");
    if (failed.length) throw new Error(`Authentication failed: ${failed.map((result) => result.url).join(", ")}`);
  }, [session]);
  if (!requests.length && !errors.length) return null;
  return (
    <Alert status="warning" {...props}>
      <Flex gap="2" alignItems="center" flexWrap="wrap" w="full">
        {errors.map((error) => (
          <Text key={error} w="full">
            {error}
          </Text>
        ))}
        {!!errors.length && <Button onClick={() => session?.errors$.next([])}>Dismiss errors</Button>}
        {!!requests.length && (
          <Text flex="1">Authenticate messaging relays: {requests.map((request) => request.url).join(", ")}</Text>
        )}
        {!!requests.length && (
          <Button leftIcon={<LockIcon boxSize={5} />} onClick={authenticate.run} isLoading={authenticate.loading}>
            Authenticate
          </Button>
        )}
      </Flex>
    </Alert>
  );
}
