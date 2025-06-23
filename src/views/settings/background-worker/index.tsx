import { Text } from "@chakra-ui/react";

import SimpleView from "../../../components/layout/presets/simple-view";
import { useAppTitle } from "../../../hooks/use-app-title";
import ServiceWorkerStatusCard from "./service-worker-status-card";
import ErrorLogsCard from "./error-logs-card";
import CachedFilesCard from "./cached-files-card";

export default function BackgroundWorkerSettings() {
  useAppTitle("Background Worker");

  return (
    <SimpleView title="Background Worker">
      <Text fontStyle="italic" mt="-2" px={{ base: "2", lg: 0 }}>
        Monitor and manage the background service worker that handles caching and offline functionality
      </Text>

      <ServiceWorkerStatusCard />
      <ErrorLogsCard />
      <CachedFilesCard />
    </SimpleView>
  );
}
