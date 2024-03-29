import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Flex, FlexProps, Link, Progress } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import NostrPublishAction from "../classes/nostr-publish-action";
import useSubject from "../hooks/use-subject";
import { RelayPaidTag } from "../views/relays/components/relay-card";
import { EmbedEvent } from "./embed-event";

export type PostResultsProps = {
  pub: NostrPublishAction;
};

export function PublishDetails({ pub }: PostResultsProps & Omit<FlexProps, "children">) {
  const results = useSubject(pub.results);

  return (
    <Flex direction="column" gap="2">
      <EmbedEvent event={pub.event} />
      <Progress value={(results.length / pub.relays.length) * 100} size="lg" hasStripe />
      {results.map(({ result, relay }) => (
        <Alert key={relay.url} status={result[2] ? "success" : "warning"}>
          <AlertIcon />
          <Box>
            <AlertTitle>
              <Link as={RouterLink} to={`/r/${encodeURIComponent(relay.url)}`}>
                {relay.url}
              </Link>
              <RelayPaidTag url={relay.url} />
            </AlertTitle>
            {result[3] && <AlertDescription>{result[3]}</AlertDescription>}
          </Box>
        </Alert>
      ))}
    </Flex>
  );
}
