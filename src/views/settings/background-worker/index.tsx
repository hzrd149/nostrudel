import { Alert, AlertTitle, AlertIcon, Text, AlertDescription } from "@chakra-ui/react";

import SimpleView from "../../../components/layout/presets/simple-view";
import { CAP_IS_WEB } from "../../../env";
import { useAppTitle } from "../../../hooks/use-app-title";
import CachedFilesCard from "./cached-files-card";
import ErrorLogsCard from "./error-logs-card";
import ServiceWorkerStatusCard from "./service-worker-status-card";

export default function BackgroundWorkerSettings() {
  useAppTitle("Background Worker");
  const supported = "serviceWorker" in navigator;

  return (
    <SimpleView title="Background Worker">
      <Text fontStyle="italic" mt="-2" px={{ base: "2", lg: 0 }}>
        Monitor and manage the background service worker that handles caching and offline functionality
      </Text>

      {supported ? (
        <>
          <ServiceWorkerStatusCard />
          <ErrorLogsCard />
          {CAP_IS_WEB && <CachedFilesCard />}
        </>
      ) : (
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Service worker is not supported on this browser</AlertTitle>
          <AlertDescription>
            Service workers are not supported on this browser. Please use a supported browser to use this feature.
          </AlertDescription>
        </Alert>
      )}
    </SimpleView>
  );
}
