import {
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { ChevronDownIcon, ChevronUpIcon } from "../../components/icons";
import Delete from "../../components/icons/delete";
import SimpleView from "../../components/layout/presets/simple-view";
import { useAppTitle } from "../../hooks/use-app-title";
import { clearServiceWorkerErrorLogs, getServiceWorkerErrorLogs } from "../../sw/client/error-logger";
import type { ServiceWorkerErrorLog } from "../../sw/worker/error-handler";

function ServiceWorkerStatusCard() {
  const [serviceWorkerState, setServiceWorkerState] = useState<string>("unknown");
  const [isCheckingForUpdate, setIsCheckingForUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const toast = useToast();

  // Check service worker status
  useEffect(() => {
    const checkServiceWorkerStatus = () => {
      if (!("serviceWorker" in navigator)) {
        setServiceWorkerState("not-supported");
        return;
      }

      if (navigator.serviceWorker.controller) {
        setServiceWorkerState("active");
      } else {
        navigator.serviceWorker.ready
          .then(() => {
            setServiceWorkerState("active");
          })
          .catch(() => {
            setServiceWorkerState("inactive");
          });
      }
    };

    checkServiceWorkerStatus();

    // Listen for service worker updates
    navigator.serviceWorker?.addEventListener("controllerchange", checkServiceWorkerStatus);

    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", checkServiceWorkerStatus);
    };
  }, []);

  // Check for service worker updates
  const checkForUpdate = async () => {
    if (!("serviceWorker" in navigator)) {
      toast({
        title: "Service workers not supported",
        description: "Your browser doesn't support service workers",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsCheckingForUpdate(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        toast({
          title: "No service worker found",
          description: "No service worker registration found",
          status: "warning",
          duration: 3000,
        });
        return;
      }

      // Check for update
      await registration.update();

      // Check if there's a waiting service worker (new version available)
      if (registration.waiting) {
        setUpdateAvailable(true);
        toast({
          title: "Update available",
          description: "A new version is available. Click 'Apply Update' to refresh.",
          status: "info",
          duration: 5000,
        });
      } else {
        toast({
          title: "No updates available",
          description: "You're running the latest version",
          status: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
      toast({
        title: "Update check failed",
        description: "Could not check for service worker updates",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsCheckingForUpdate(false);
    }
  };

  // Apply the waiting service worker and refresh
  const applyUpdate = async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration?.waiting) {
        // Tell the waiting service worker to skip waiting and become active
        registration.waiting.postMessage({ type: "SKIP_WAITING" });

        // Listen for the controller change (when new SW takes control)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // Refresh the page to use the new service worker
          window.location.reload();
        });
      }
    } catch (error) {
      console.error("Failed to apply update:", error);
      toast({
        title: "Update failed",
        description: "Could not apply the service worker update",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Listen for service worker updates
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleUpdateFound = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        setUpdateAvailable(true);
      }
    };

    navigator.serviceWorker.addEventListener("updatefound", handleUpdateFound);

    return () => {
      navigator.serviceWorker.removeEventListener("updatefound", handleUpdateFound);
    };
  }, []);

  const getServiceWorkerStatusBadge = () => {
    switch (serviceWorkerState) {
      case "active":
        return <Badge colorScheme="green">Active</Badge>;
      case "inactive":
        return <Badge colorScheme="red">Inactive</Badge>;
      case "not-supported":
        return <Badge colorScheme="gray">Not Supported</Badge>;
      default:
        return <Badge colorScheme="yellow">Unknown</Badge>;
    }
  };

  return (
    <Card p={4} rounded="md">
      <VStack align="stretch" spacing={4}>
        <Heading size="md">Service Worker Status</Heading>

        <HStack>
          <Text fontWeight="semibold">Status:</Text>
          {getServiceWorkerStatusBadge()}
        </HStack>

        {serviceWorkerState === "active" && (
          <VStack align="stretch" spacing={2}>
            <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
              Service worker is running and handling requests
            </Text>
            <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
              Controller: {navigator.serviceWorker.controller?.scriptURL || "Unknown"}
            </Text>
          </VStack>
        )}

        {serviceWorkerState === "inactive" && (
          <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
            Service worker is not currently active
          </Text>
        )}

        {serviceWorkerState === "not-supported" && (
          <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
            Service workers are not supported in this browser
          </Text>
        )}

        {serviceWorkerState === "active" && (
          <HStack spacing={3} pt={2}>
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={checkForUpdate}
              isLoading={isCheckingForUpdate}
              loadingText="Checking..."
            >
              Check for Update
            </Button>

            {updateAvailable && (
              <Button size="sm" colorScheme="green" onClick={applyUpdate}>
                Apply Update
              </Button>
            )}
          </HStack>
        )}
      </VStack>
    </Card>
  );
}

function ErrorLogsCard() {
  const [errorLogs, setErrorLogs] = useState<ServiceWorkerErrorLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isClearingLogs, setIsClearingLogs] = useState(false);
  const { isOpen: isErrorLogOpen, onToggle: toggleErrorLog } = useDisclosure();
  const toast = useToast();

  // Load error logs
  const loadErrorLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await getServiceWorkerErrorLogs();
      setErrorLogs(logs);
    } catch (error) {
      console.error("Failed to load error logs:", error);
      toast({
        title: "Failed to load error logs",
        description: "Could not retrieve error logs from service worker",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Clear error logs
  const handleClearLogs = async () => {
    setIsClearingLogs(true);
    try {
      const success = await clearServiceWorkerErrorLogs();
      if (success) {
        setErrorLogs([]);
        toast({
          title: "Error logs cleared",
          description: "All error logs have been cleared successfully",
          status: "success",
          duration: 3000,
        });
      } else {
        throw new Error("Clear operation failed");
      }
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

  // Load error logs when opening the error log section
  useEffect(() => {
    if (isErrorLogOpen) {
      loadErrorLogs();
    }
  }, [isErrorLogOpen]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  return (
    <Card p={4} rounded="md">
      <Flex justify="space-between" align="center" mb={4}>
        <HStack>
          <Heading size="md">Error Logs</Heading>
          {errorLogs.length > 0 && (
            <Badge colorScheme="red" borderRadius="full">
              {errorLogs.length}
            </Badge>
          )}
        </HStack>
        <HStack>
          {isErrorLogOpen && errorLogs.length > 0 && (
            <IconButton
              aria-label="Clear error logs"
              icon={<Delete />}
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={handleClearLogs}
              isLoading={isClearingLogs}
            />
          )}
          <IconButton
            aria-label={isErrorLogOpen ? "Collapse error logs" : "Expand error logs"}
            icon={isErrorLogOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            size="sm"
            variant="ghost"
            onClick={toggleErrorLog}
          />
        </HStack>
      </Flex>

      <Collapse in={isErrorLogOpen}>
        {isLoadingLogs ? (
          <Flex justify="center" p={4}>
            <Spinner />
          </Flex>
        ) : errorLogs.length === 0 ? (
          <Text color="gray.500" textAlign="center" py={4}>
            No error logs found
          </Text>
        ) : (
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
                            {truncateMessage(log.stack, 150)}
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
        )}
      </Collapse>
    </Card>
  );
}

export default function BackgroundWorkerSettings() {
  useAppTitle("Background Worker");

  return (
    <SimpleView title="Background Worker" maxW="4xl">
      <Text fontStyle="italic" mt="-2" px={{ base: "2", lg: 0 }}>
        Monitor and manage the background service worker that handles caching and offline functionality
      </Text>

      <ServiceWorkerStatusCard />
      <ErrorLogsCard />
    </SimpleView>
  );
}
