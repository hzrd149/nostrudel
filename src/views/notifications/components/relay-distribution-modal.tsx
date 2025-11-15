import { useMemo } from "react";
import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { getSeenRelays, isFromCache } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import { Filter as NostrFilter } from "nostr-tools";

import RelayDistributionChart from "../../../components/charts/relay-distribution-chart";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RelayName from "../../../components/relay/relay-name";

export type RelayDistributionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  filter: NostrFilter;
  title?: string;
};

type RelayStats = {
  relay: string;
  count: number;
  percentage: number;
};

export default function RelayDistributionModal({
  isOpen,
  onClose,
  filter,
  title = "Relay Distribution",
}: RelayDistributionModalProps) {
  // Fetch events from the store using the provided filter
  const events = useEventModel(TimelineModel, [filter]) ?? [];

  // Calculate relay statistics
  const relayStats = useMemo<RelayStats[]>(() => {
    const relayCount: Record<string, number> = {};
    let cacheCount = 0;

    // Process events to count messages per relay and cache
    if (events) {
      events.forEach((event) => {
        if (isFromCache(event)) cacheCount++;

        // Also check relay sources (an event can be from cache AND have relay info)
        const seenRelays = getSeenRelays(event);
        if (seenRelays) {
          seenRelays.forEach((relay) => {
            relayCount[relay] = (relayCount[relay] || 0) + 1;
          });
        }
      });
    }

    // Convert to array with percentages
    const stats: RelayStats[] = Object.entries(relayCount).map(([relay, count]) => ({
      relay,
      count,
      percentage: (count / events.length) * 100,
    }));

    // Add cache if present
    if (cacheCount > 0) {
      stats.push({
        relay: "Cache",
        count: cacheCount,
        percentage: (cacheCount / events.length) * 100,
      });
    }

    // Sort by count descending
    return stats.sort((a, b) => b.count - a.count);
  }, [events]);

  // Show message if no data to display
  if (!events || events.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader p="4">{title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody px="4" pt="0" pb="4">
            No events to display
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" pt="0" pb="4">
          <Box height="400px" mb="4">
            <RelayDistributionChart events={events} title="Events from relays" />
          </Box>

          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Relay</Th>
                  <Th isNumeric>Count</Th>
                  <Th isNumeric>Percentage</Th>
                </Tr>
              </Thead>
              <Tbody>
                {relayStats.map((stat) => (
                  <Tr key={stat.relay}>
                    <Td maxW="md" overflow="hidden">
                      {stat.relay === "Cache" ? (
                        <Flex gap="2" alignItems="center">
                          {stat.relay}
                        </Flex>
                      ) : (
                        <Flex gap="2" alignItems="center">
                          <RelayFavicon relay={stat.relay} size="xs" />
                          <RelayName relay={stat.relay} isTruncated />
                        </Flex>
                      )}
                    </Td>
                    <Td isNumeric>{stat.count}</Td>
                    <Td isNumeric>{stat.percentage.toFixed(1)}%</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
