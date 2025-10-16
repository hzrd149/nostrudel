import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useObservableState } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";
import { useMemo } from "react";

type OutboxMap = Record<string, ProfilePointer[]>;

interface RelayStats {
  selectedRelays: number;
  connectedRelays: number;
  coveragePercentage: number;
  totalUsers: number;
  usersWithRelays: number;
}

interface RelayDetail {
  relay: string;
  userCount: number;
}

import { connections$, ConnectionState } from "../services/pool";
import RelayFavicon from "./relay/relay-favicon";
import RelayName from "./relay/relay-name";
import RelayStatusBadge from "./relays/relay-status";

// Stats Overview Component
function StatsOverview({ stats }: { stats: RelayStats }) {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Overview
      </Heading>
      <Flex gap={4} wrap="wrap">
        <Stat>
          <StatLabel>Selected Relays</StatLabel>
          <StatNumber>{stats.selectedRelays}</StatNumber>
          <StatHelpText>Total relays selected for users</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Connected Relays</StatLabel>
          <StatNumber color={stats.connectedRelays > 0 ? "green.500" : "red.500"}>{stats.connectedRelays}</StatNumber>
          <StatHelpText>Currently connected relays</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Coverage</StatLabel>
          <StatNumber
            color={
              stats.coveragePercentage >= 80 ? "green.500" : stats.coveragePercentage >= 50 ? "yellow.500" : "red.500"
            }
          >
            {stats.coveragePercentage}%
          </StatNumber>
          <StatHelpText>Users with connected relays</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Users</StatLabel>
          <StatNumber>{stats.totalUsers}</StatNumber>
          <StatHelpText>{stats.usersWithRelays} have relays</StatHelpText>
        </Stat>
      </Flex>
    </Box>
  );
}

// Connection Progress Component
function ConnectionProgress({ stats }: { stats: RelayStats }) {
  return (
    <Box>
      <Text mb={2}>User Coverage</Text>
      <Progress
        value={stats.coveragePercentage}
        colorScheme={stats.coveragePercentage >= 80 ? "green" : stats.coveragePercentage >= 50 ? "yellow" : "red"}
        size="lg"
        borderRadius="md"
      />
      <Text fontSize="sm" color="gray.500" mt={1}>
        Users with connected relays: {stats.coveragePercentage}% coverage
      </Text>
    </Box>
  );
}

// Relay Details Table Component
function RelayDetailsTable({ relayDetails, stats }: { relayDetails: RelayDetail[]; stats: RelayStats }) {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Relay Details
      </Heading>
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Relay</Th>
              <Th isNumeric>Users</Th>
              <Th>Status</Th>
              <Th isNumeric>% of Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {relayDetails.map(({ relay, userCount }) => (
              <Tr key={relay}>
                <Td>
                  <RelayFavicon relay={relay} size="xs" me="2" />
                  <RelayName relay={relay} />
                </Td>
                <Td isNumeric>{userCount}</Td>
                <Td>
                  <RelayStatusBadge relay={relay} />
                </Td>
                <Td isNumeric>{stats.totalUsers > 0 ? Math.round((userCount / stats.totalUsers) * 100) : 0}%</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// Summary Section Component
function SummarySection({ stats }: { stats: RelayStats }) {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Summary
      </Heading>
      <VStack align="stretch" spacing={2}>
        <Text>
          • <strong>{stats.selectedRelays}</strong> relays selected for <strong>{stats.totalUsers}</strong> users
        </Text>
        <Text>
          • <strong>{stats.coveragePercentage}%</strong> of users have at least one connected relay
        </Text>
        <Text>
          • <strong>{stats.usersWithRelays}</strong> users have relay lists configured
        </Text>
        <Text>
          • <strong>{stats.totalUsers - stats.usersWithRelays}</strong> users have no relay lists
        </Text>
      </VStack>
    </Box>
  );
}

function RelayDebuggerModal({
  isOpen,
  onClose,
  outboxMap,
  selection,
}: {
  isOpen: boolean;
  onClose: () => void;
  outboxMap: OutboxMap | null;
  selection: ProfilePointer[] | null;
}) {
  // Get connection states
  const connections = useObservableState(connections$);

  // Calculate stats
  const stats: RelayStats = useMemo(() => {
    if (!outboxMap || !connections || !selection) {
      return {
        selectedRelays: 0,
        connectedRelays: 0,
        coveragePercentage: 0,
        totalUsers: 0,
        usersWithRelays: 0,
      };
    }

    const selectedRelays = Object.keys(outboxMap).length;
    const connectedRelays = Object.keys(outboxMap).filter((relay) => connections[relay] === "connected").length;

    // Calculate coverage as users with at least one connected relay / total users
    const usersWithConnectedRelays = selection.filter((user) => {
      if (!user.relays || user.relays.length === 0) return false;
      return user.relays.some((relay) => connections[relay] === "connected");
    }).length;

    const totalUsers = selection.length;
    const coveragePercentage = totalUsers > 0 ? Math.round((usersWithConnectedRelays / totalUsers) * 100) : 0;
    const usersWithRelays = selection.filter((user) => user.relays && user.relays.length > 0).length;

    return {
      selectedRelays,
      connectedRelays,
      coveragePercentage,
      totalUsers,
      usersWithRelays,
    };
  }, [outboxMap, connections, selection]);

  // Get relay details for table
  const relayDetails: RelayDetail[] = useMemo(() => {
    if (!outboxMap || !connections) return [];

    return Object.entries(outboxMap)
      .map(([relay, users]) => ({
        relay,
        userCount: users.length,
      }))
      .sort((a, b) => b.userCount - a.userCount);
  }, [outboxMap, connections]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Outbox Relay Selection Debugger</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            <StatsOverview stats={stats} />
            <ConnectionProgress stats={stats} />
            <RelayDetailsTable relayDetails={relayDetails} stats={stats} />
            <SummarySection stats={stats} />
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default function OutboxRelayDebugger({
  outboxMap,
  selection,
}: {
  outboxMap: OutboxMap;
  selection: ProfilePointer[];
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Get connection states for button display
  const connections = useObservableState(connections$);

  // Calculate stats for button
  const stats = useMemo(() => {
    if (!outboxMap || !connections || !selection) {
      return {
        selectedRelays: 0,
        connectedRelays: 0,
        coveragePercentage: 0,
      };
    }

    const selectedRelays = Object.keys(outboxMap).length;
    const connectedRelays = Object.keys(outboxMap).filter((relay) => connections[relay] === "connected").length;

    // Calculate coverage as users with at least one connected relay / total users
    const usersWithConnectedRelays = selection.filter((user) => {
      if (!user.relays || user.relays.length === 0) return false;
      return user.relays.some((relay) => connections[relay] === "connected");
    }).length;

    const coveragePercentage =
      selection.length > 0 ? Math.round((usersWithConnectedRelays / selection.length) * 100) : 0;

    return {
      selectedRelays,
      connectedRelays,
      coveragePercentage,
    };
  }, [outboxMap, connections, selection]);

  if (!outboxMap || !selection) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={onOpen}
        colorScheme={stats.coveragePercentage >= 80 ? "green" : stats.coveragePercentage >= 50 ? "yellow" : "red"}
      >
        {stats.connectedRelays}/{stats.selectedRelays} ({stats.coveragePercentage}%)
      </Button>
      <RelayDebuggerModal isOpen={isOpen} onClose={onClose} outboxMap={outboxMap} selection={selection} />
    </>
  );
}
