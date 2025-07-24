import { Button, Card, CardBody, CardFooter, CardHeader, Heading, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { useObservableEagerState } from "applesauce-react/hooks";
import useAsyncAction from "../../../../hooks/use-async-action";
import { changeEventCache, eventCache$ } from "../../../../services/event-cache";

export default function NativeSqliteCard() {
  const eventCache = useObservableEagerState(eventCache$);
  const enabled = eventCache?.type === "native-sqlite";
  const enable = useAsyncAction(async () => {
    await changeEventCache("native-sqlite");
  });

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Native SQLite Cache</Heading>
        <Button
          size="sm"
          colorScheme="primary"
          ml="auto"
          onClick={enable.run}
          isDisabled={enabled}
          isLoading={enable.loading}
        >
          {enabled ? "Enabled" : "Enable"}
        </Button>
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">
          Use{" "}
          <Link href="https://github.com/capacitor-community/sqlite" isExternal color="blue.500">
            @capacitor-community/sqlite
          </Link>{" "}
          package to connect to a native SQLite database.
        </Text>
        <Text>Maximum capacity: Unlimited</Text>
        <Text>Performance: Blazingly fast</Text>
      </CardBody>
      {enabled && (
        <CardFooter p="4" pt="0">
          <Button size="sm" colorScheme="primary" ml="auto" as={RouterLink} to="/relays/cache/database">
            Database Tools
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
