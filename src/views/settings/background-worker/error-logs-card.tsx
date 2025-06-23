import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";

import Delete from "../../../components/icons/delete";
import ExpandableCard from "../../../components/expandable-card";
import { clearServiceWorkerErrorLogs, getServiceWorkerErrorLogs } from "../../../sw/client/error-logger";
import type { ServiceWorkerErrorLog } from "../../../sw/worker/error-handler";

export default function ErrorLogsCard() {
  const [errorLogs, setErrorLogs] = useState<ServiceWorkerErrorLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isClearingLogs, setIsClearingLogs] = useState(false);
  const toast = useToast();

  // Load error logs
  const loadErrorLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await getServiceWorkerErrorLogs();
      setErrorLogs(logs);
    } catch (error) {
      console.error("Failed to load error logs:", error);
      setErrorLogs([]);
      toast({
        title: "Failed to load error logs",
        description: "Could not retrieve error logs from service worker",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoadingLogs(false);
    }
  }, [toast]);

  // Clear error logs
  const handleClearLogs = async () => {
    setIsClearingLogs(true);
    try {
      await clearServiceWorkerErrorLogs();
      setErrorLogs([]);
      toast({
        title: "Error logs cleared",
        description: "All error logs have been cleared successfully",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to clear error logs:", error);
      toast({
        title: "Failed to clear error logs",
        description: "Could not clear error logs from service worker",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsClearingLogs(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateMessage = (message: string, maxLength: number = 200) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  const badge =
    errorLogs.length > 0 ? (
      <Badge colorScheme="red" borderRadius="full">
        {errorLogs.length}
      </Badge>
    ) : null;

  const expandedActions =
    errorLogs.length > 0 ? (
      <IconButton
        aria-label="Clear error logs"
        icon={<Delete />}
        size="sm"
        colorScheme="red"
        variant="outline"
        onClick={handleClearLogs}
        isLoading={isClearingLogs}
      />
    ) : null;

  return (
    <ExpandableCard
      title="Error Logs"
      badge={badge}
      isLoading={isLoadingLogs}
      isEmpty={errorLogs.length === 0}
      emptyMessage="No error logs found"
      expandedActions={expandedActions}
      onExpand={loadErrorLogs}
    >
      <Box>
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Time</Th>
                <Th>Context</Th>
                <Th>Message</Th>
                <Th>URL</Th>
              </Tr>
            </Thead>
            <Tbody>
              {errorLogs.map((log, index) => (
                <Tr key={index}>
                  <Td fontSize="xs" whiteSpace="nowrap">
                    {formatTimestamp(log.timestamp)}
                  </Td>
                  <Td>
                    <Badge size="sm" colorScheme="blue">
                      {log.context}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm" title={log.message}>
                      {truncateMessage(log.message)}
                    </Text>
                    {log.stack && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {truncateMessage(log.stack, 300)}
                      </Text>
                    )}
                  </Td>
                  <Td fontSize="xs" color="gray.500">
                    {log.url}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <Flex
          justify="space-between"
          align="center"
          mt={4}
          pt={4}
          borderTop="1px"
          borderColor="gray.200"
          _dark={{ borderColor: "gray.600" }}
        >
          <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
            {errorLogs.length} error{errorLogs.length !== 1 ? "s" : ""} found
          </Text>
          <Button
            leftIcon={<Delete />}
            size="sm"
            colorScheme="red"
            variant="outline"
            onClick={handleClearLogs}
            isLoading={isClearingLogs}
          >
            Clear All Logs
          </Button>
        </Flex>
      </Box>
    </ExpandableCard>
  );
}
