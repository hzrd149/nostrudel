import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Flex, FlexProps, Link, Progress } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import NostrPublishAction from "../classes/nostr-publish-action";
import useSubject from "../hooks/use-subject";
import { RelayPaidTag } from "../views/relays/components/relay-card";

export type PostResultsProps = {
  pub: NostrPublishAction;
};

export const PublishDetails = ({ pub }: PostResultsProps & Omit<FlexProps, "children">) => {
  const results = useSubject(pub.results);

  return (
    <Flex direction="column" gap="2">
      <Progress value={(results.length / pub.relays.length) * 100} size="lg" hasStripe />
      {results.map((result) => (
        <Alert key={result.relay.url} status={result.status ? "success" : "warning"}>
          <AlertIcon />
          <Box>
            <AlertTitle>
              <Link as={RouterLink} to={`/r/${encodeURIComponent(result.relay.url)}`}>
                {result.relay.url}
              </Link>
              <RelayPaidTag url={result.relay.url} />
            </AlertTitle>
            {result.message && <AlertDescription>{result.message}</AlertDescription>}
          </Box>
        </Alert>
      ))}
    </Flex>
  );
};
