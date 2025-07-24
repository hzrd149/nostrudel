import { Button, Card, CardBody, CardHeader, Heading, Text } from "@chakra-ui/react";

import { useObservableEagerState } from "applesauce-react/hooks";
import useAsyncAction from "../../../../hooks/use-async-action";
import { changeEventCache, eventCache$ } from "../../../../services/event-cache";

export default function NoCacheCard() {
  const eventCache = useObservableEagerState(eventCache$);
  const enabled = eventCache === null;

  const enable = useAsyncAction(async () => {
    await changeEventCache("none");
  });

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">No Cache</Heading>
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
        <Text mb="2">No local relay, nothing is cached</Text>
        <Text>Maximum capacity: 0</Text>
        <Text>Performance: As fast as the relays your connecting to</Text>
        <Text color="blue.500">NOTE: Profiles and Timelines are still cached in memory</Text>
      </CardBody>
    </Card>
  );
}
