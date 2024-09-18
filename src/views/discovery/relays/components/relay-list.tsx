import { useMemo, useState } from "react";
import { useThrottle } from "react-use";
import { NostrEvent } from "nostr-tools";
import { Box, Flex, FlexProps, Input, Text } from "@chakra-ui/react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import RelayStatusCard from "./relay-status-card";

/** returns a map of nip -> percent supported */
function computeCommonNips(events: NostrEvent[]) {
  const common = new Map<number, number>();

  for (const event of events) {
    for (const tag of event.tags) {
      if (tag[0] === "N" && tag[1]) {
        const nip = parseInt(tag[1]);
        if (Number.isFinite(nip)) common.set(nip, (common.get(nip) ?? 0) + 1);
      }
    }
  }

  for (const [nip, count] of common) {
    common.set(nip, count / events.length);
  }

  return common;
}

function Row({ index, style, data }: ListChildComponentProps<NostrEvent[]>) {
  return (
    <Box style={style} pb="2">
      <RelayStatusCard event={data[index]} h="full" />
    </Box>
  );
}

export default function RelayList({ events, ...props }: Omit<FlexProps, "children"> & { events: NostrEvent[] }) {
  const [filter, setFilter] = useState("");

  const filterThrottle = useThrottle(filter.toLocaleLowerCase(), 100);
  const filtered = useMemo(() => {
    if (filterThrottle.length >= 1)
      return events.filter((event) =>
        event.tags.some((t) => {
          if (t[1]) return t[1].toLocaleLowerCase().includes(filterThrottle);
        }),
      );
    else return events;
  }, [filterThrottle, events]);

  // const commonNips = useMemo(() => computeCommonNips(filtered), [filtered]);

  return (
    <Flex direction="column" gap="2" overflow="hidden" {...props}>
      <Flex gap="2">
        <Input type="search" placeholder="filter relays" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </Flex>
      <Text fontSize="sm">{filtered.length} Relays</Text>
      <Flex direction="column" flex={1}>
        <AutoSizer>
          {({ height, width }) => (
            <List itemCount={filtered.length} itemSize={200} itemData={filtered} width={width} height={height}>
              {Row}
            </List>
          )}
        </AutoSizer>
      </Flex>
    </Flex>
  );
}
