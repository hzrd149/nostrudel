import { Button, Card, CardBody, CardHeader, Heading, Link, Text } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { useAsync } from "react-use";

import useAsyncAction from "../../../../hooks/use-async-action";
import { changeEventCache, eventCache$ } from "../../../../services/event-cache";
import { checkLocalRelay } from "../../../../services/local-relay";

export default function CitrineRelayCard() {
  const { value: available, loading: checking } = useAsync(checkLocalRelay);

  const eventCache = useObservableEagerState(eventCache$);
  const enabled = eventCache?.type === "local-relay";

  const enable = useAsyncAction(async () => {
    await changeEventCache("local-relay");
  });

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Citrine</Heading>
        <Link color="blue.500" href="https://github.com/greenart7c3/Citrine" isExternal>
          GitHub
        </Link>
        {available ? (
          <Button
            size="sm"
            colorScheme="primary"
            ml="auto"
            isLoading={checking || enable.loading}
            onClick={enable.run}
            isDisabled={enabled}
          >
            {enabled ? "Enabled" : "Enable"}
          </Button>
        ) : (
          <Button
            as={Link}
            isExternal
            href="https://github.com/greenart7c3/Citrine"
            colorScheme="blue"
            size="sm"
            ml="auto"
          >
            Get the app
          </Button>
        )}
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">A cool little app that runs a local relay in your phone</Text>
        <Text>Maximum capacity: Unlimited</Text>
        <Text>Performance: As fast as your phone</Text>
      </CardBody>
    </Card>
  );
}
