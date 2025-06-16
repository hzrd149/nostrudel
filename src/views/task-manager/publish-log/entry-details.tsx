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
import { useObservableEagerState } from "applesauce-react/hooks";
import { PublishResponse } from "applesauce-relay";
import { Link as RouterLink } from "react-router-dom";

import { EmbedEventCard } from "../../../components/embed-event/card";
import { PublishLogEntry } from "../../../providers/global/publish-provider";
import { RelayPaidTag } from "../../relays/components/relay-card";

function PublishResultRow({ packet }: { packet: PublishResponse }) {
  return (
    <Alert status={packet.ok ? "success" : "warning"}>
      <AlertIcon />
      <Box>
        <AlertTitle>
          <Link as={RouterLink} to={`/relays/${encodeURIComponent(packet.from)}`}>
            {packet.from}
          </Link>
          <RelayPaidTag url={packet.from} />
        </AlertTitle>
        {packet.message && <AlertDescription>{packet.message}</AlertDescription>}
      </Box>
    </Alert>
  );
}

export function PublishLogEntryDetails({ entry }: { entry: PublishLogEntry } & Omit<FlexProps, "children">) {
  const { relays } = useObservableEagerState(entry);

  return (
    <Flex direction="column" gap="2">
      <EmbedEventCard event={entry.event} />
      <Progress value={(Object.keys(relays).length / entry.relays.length) * 100} size="lg" hasStripe />
      {Object.entries(relays).map(([url, packet]) =>
        packet ? (
          <PublishResultRow key={url} packet={packet} />
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
