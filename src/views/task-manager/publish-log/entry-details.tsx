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
import { useObservableState } from "applesauce-react/hooks";
import { PublishResponse } from "applesauce-relay";
import { Link as RouterLink } from "react-router-dom";

import { EmbedEventCard } from "../../../components/embed-event/card";
import { PublishLogEntry } from "../../../providers/global/publish-provider";
import { RelayPaidTag } from "../../relays/components/relay-card";

function PublishResultRow({ response }: { response: PublishResponse }) {
  return (
    <Alert status={response.ok ? "success" : "warning"}>
      <AlertIcon />
      <Box>
        <AlertTitle>
          <Link as={RouterLink} to={`/relays/${encodeURIComponent(response.from)}`}>
            {response.from}
          </Link>
          <RelayPaidTag url={response.from} />
        </AlertTitle>
        {response.message && <AlertDescription>{response.message}</AlertDescription>}
      </Box>
    </Alert>
  );
}

export function PublishLogEntryDetails({ entry }: { entry: PublishLogEntry } & Omit<FlexProps, "children">) {
  const relayStatus = useObservableState(entry.relayStatus$) ?? {};

  return (
    <Flex direction="column" gap="2">
      <EmbedEventCard event={entry.event} />
      <Progress value={(Object.keys(relayStatus).length / entry.relays.length) * 100} size="lg" hasStripe />
      {Object.entries(relayStatus).map(([url, response]) =>
        response ? (
          <PublishResultRow key={url} response={response} />
        ) : (
          <Alert key={url} status="info">
            <Spinner mr="2" />
            <Box>
              <AlertTitle>
                <Link as={RouterLink} to={`/relays/${encodeURIComponent(url)}`}>
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
