import { Badge, Button, Card, HStack, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function ServiceWorkerStatusCard() {
  const [serviceWorkerState, setServiceWorkerState] = useState<string>("unknown");
  const [isCheckingForUpdate, setIsCheckingForUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const toast = useToast();

  // Check service worker status
  useEffect(() => {
    const checkServiceWorkerStatus = () => {
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
    setIsCheckingForUpdate(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration)
        return toast({
          title: "No service worker found",
          description: "No service worker registration found",
          status: "warning",
          duration: 3000,
        });

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
      default:
        return <Badge colorScheme="yellow">Unknown</Badge>;
    }
  };

  return (
    <Card p={4} rounded="md">
      <VStack align="stretch" spacing={4}>
        <Text fontSize="lg" fontWeight="bold">
          Service Worker Status
        </Text>

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
