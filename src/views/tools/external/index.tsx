import { Box, Heading, Text } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { useParams } from "react-router-dom";

import SimpleView from "../../../components/layout/presets/simple-view";
import { externalTools } from "../../../components/navigation/apps";

export default function ExternalAppView() {
  const { id } = useParams<{ id: string }>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Find the external app by ID
  const app = externalTools.find((app) => app.id === id);

  const handleIframeLoad = () => {
    setIsLoading(false);

    // Try to access the iframe's window
    try {
      // Note: This will likely fail due to CORS restrictions
      const iframeWindow = iframeRef.current?.contentWindow;
      if (iframeWindow) {
        console.log("Successfully accessed iframe window:", iframeWindow);
      }
    } catch (error) {
      console.log("Could not access iframe window due to CORS:", error);
    }
  };

  const handleIframeError = () => {
    setIsLoading(false);
  };

  if (!app) {
    return (
      <SimpleView title="App Not Found">
        <Box textAlign="center" py={8}>
          <Heading size="lg" mb={4}>
            External App Not Found
          </Heading>
          <Text color="gray.500">The app with ID "{id}" could not be found.</Text>
        </Box>
      </SimpleView>
    );
  }

  return (
    <Box h="100vh" position="relative">
      {isLoading && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1}
          bg="white"
          p={4}
          borderRadius="md"
          boxShadow="md"
        >
          <Text>Loading {app.title}...</Text>
        </Box>
      )}
      <iframe
        ref={iframeRef}
        src={app.to}
        width="100%"
        height="100%"
        style={{
          border: "none",
          borderRadius: "8px",
        }}
        title={app.title}
        allow="camera; microphone; geolocation; clipboard-read; clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </Box>
  );
}
