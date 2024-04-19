import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Flex,
  FlexProps,
  Link,
  Progress,
  Spinner,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import NostrPublishAction, { PublishResult } from "../classes/nostr-publish-action";
import useSubject from "../hooks/use-subject";
import { RelayPaidTag } from "../views/relays/components/relay-card";
import { EmbedEvent } from "./embed-event";

export type PostResultsProps = {
  pub: NostrPublishAction;
};

function PublishResultRow({ result }: { result: PublishResult }) {
  return (
    <Alert status={result.success ? "success" : "warning"}>
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
  );
}

export function PublishDetails({ pub }: PostResultsProps & Omit<FlexProps, "children">) {
  const results = useSubject(pub.results);

  const relayResults: Record<string, PublishResult | undefined> = {};
  for (const url of pub.relays) {
    relayResults[url] = results.find((r) => r.relay.url === url);
  }

  return (
    <Flex direction="column" gap="2">
      <EmbedEvent event={pub.event} />
      <Progress value={(results.length / pub.relays.length) * 100} size="lg" hasStripe />
      {Object.entries(relayResults).map(([url, result]) =>
        result ? (
          <PublishResultRow key={url} result={result} />
        ) : (
          <Alert key={url} status="info">
            <Spinner mr="2" />
            <Box>
              <AlertTitle>
                <Link as={RouterLink} to={`/r/${encodeURIComponent(url)}`}>
                  {url}
                </Link>
                <RelayPaidTag url={url} />
              </AlertTitle>
            </Box>
          </Alert>
        ),
      )}
    </Flex>
  );
}
