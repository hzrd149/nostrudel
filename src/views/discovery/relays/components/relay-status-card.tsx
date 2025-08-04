import {
  Badge,
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Heading,
  Link,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { getEventUID, getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { useContext } from "react";

import RelayFavicon from "../../../../components/relay/relay-favicon";
import Timestamp from "../../../../components/timestamp";
import SupportedNIPs from "../../../relays/components/supported-nips";
import { SelectedContext } from "../selected-context";

const IgnoreNips = [1, 2, 4, 11, 12, 15, 16];

export default function RelayStatusCard({
  event,
  commonNips,
  ...props
}: Omit<CardProps, "children"> & {
  event: NostrEvent;
  commonNips?: Map<number, number>;
}) {
  const selected = useContext(SelectedContext);

  const identity = getTagValue(event, "d");
  const network = getTagValue(event, "n");

  const countryName = event.tags.find((t) => t[0] === "l" && t[2] === "countryName")?.[1];
  const host = event.tags.find((t) => t[0] === "l" && t[2] === "host.isp")?.[1];

  const nips = event.tags
    .filter((t) => t[0] === "N" && t[1])
    .map((t) => parseInt(t[1]))
    .filter((n) => Number.isFinite(n))
    .filter((n) => !IgnoreNips.includes(n))
    .filter((n) => (commonNips ? (commonNips.get(n) ?? 1) < 0.8 : true));

  return (
    <Card {...props}>
      <CardHeader display="flex" alignItems="center" py="2" px="2" gap="2">
        {identity && <RelayFavicon relay={identity} size="sm" />}
        <Heading size="sm" isTruncated>
          <Link onClick={() => selected.setValue(getEventUID(event))}>{identity}</Link>
        </Heading>
        <Timestamp timestamp={event.created_at} />
        <Spacer />
        <Badge>{network}</Badge>
      </CardHeader>
      <CardBody px="2" pt="0" pb="0" display="flex" gap="2" flexDirection="column">
        <Box>
          {countryName && <Text>Country: {countryName}</Text>}
          {host && <Text>Host: {host}</Text>}
        </Box>
      </CardBody>
      <CardFooter p="2">
        <SupportedNIPs nips={nips} />
      </CardFooter>
    </Card>
  );
}
