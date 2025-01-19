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
import { useObservable } from "applesauce-react/hooks";
import { OkPacketAgainstEvent } from "rx-nostr";

import { RelayPaidTag } from "../../relays/components/relay-card";
import { EmbedEvent } from "../../../components/embed-event";
import { PublishLogEntry } from "../../../providers/global/publish-provider";

function PublishResultRow({ packet }: { packet: OkPacketAgainstEvent }) {
  return (
    <Alert status={packet.ok ? "success" : "warning"}>
      <AlertIcon />
      <Box>
        <AlertTitle>
          <Link as={RouterLink} to={`/r/${encodeURIComponent(packet.from)}`}>
            {packet.from}
          </Link>
          <RelayPaidTag url={packet.from} />
        </AlertTitle>
        {packet.notice && <AlertDescription>{packet.notice}</AlertDescription>}
      </Box>
    </Alert>
  );
}

export function PublishLogEntryDetails({ entry }: { entry: PublishLogEntry } & Omit<FlexProps, "children">) {
  const { relays } = useObservable(entry);

  return (
    <Flex direction="column" gap="2">
      <EmbedEvent event={entry.event} />
      <Progress value={(Object.keys(relays).length / entry.relays.length) * 100} size="lg" hasStripe />
      {Object.entries(relays).map(([url, packet]) =>
        packet ? (
          <PublishResultRow key={url} packet={packet} />
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
