import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  IconButton,
  Link,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "../../error-boundary";
import { DownloadIcon, ExternalLinkIcon, ThingsIcon } from "../../icons";
import ExpandableEmbed from "../components/content-embed";
import { loadSTLViewerComponent } from "../../../helpers/stl-viewer-loader";
import { createRequestProxyUrl } from "../../../helpers/request";

function STLViewerWrapper({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  const corsProxy = createRequestProxyUrl("");

  useEffect(() => {
    loadSTLViewerComponent().then(() => setLoaded(true));
  }, []);

  if (!loaded)
    return (
      <Box w="full" aspectRatio={16 / 10}>
        Loading viewer...
      </Box>
    );

  return (
    <Box w="full" aspectRatio={16 / 10}>
      <stl-viewer src={src} cors-proxy={corsProxy.toString()} style={{ width: "100%", height: "100%" }} />
    </Box>
  );
}

function EmbeddedStlFile({ src }: { src: string }) {
  const preview = useDisclosure();
  const previewAppUrl = `https://hzrd149.github.io/simple-stl-viewer/?src=${encodeURIComponent(src)}`;

  return (
    <Card variant="outline">
      <CardHeader p="2" display="flex" alignItems="center" gap="2">
        <ThingsIcon boxSize={6} />
        <Heading size="sm">STL File</Heading>
        <ButtonGroup size="sm" ml="auto">
          <IconButton
            as="a"
            href={previewAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ExternalLinkIcon />}
            aria-label="Open in Viewer"
            title="Open in Viewer"
          />
          <IconButton icon={<DownloadIcon />} aria-label="Download File" title="Download File" />
          {!preview.isOpen && (
            <Button colorScheme="primary" onClick={preview.onOpen}>
              Preview
            </Button>
          )}
        </ButtonGroup>
      </CardHeader>
      {preview.isOpen && (
        <CardBody px="2" pt="0" pb="2" overflow="hidden" whiteSpace="initial">
          <ErrorBoundary>
            <STLViewerWrapper src={src} />
          </ErrorBoundary>
        </CardBody>
      )}
      <CardFooter p="2" pt="0" pb="2">
        <Link isExternal href={src} color="blue.500">
          {src}
        </Link>
      </CardFooter>
    </Card>
  );
}

export function renderModelUrl(match: URL) {
  if (!match.pathname.endsWith(".stl")) return null;

  return (
    <ExpandableEmbed label="STL Model" url={match} hideOnDefaultOpen>
      <EmbeddedStlFile src={match.toString()} />
    </ExpandableEmbed>
  );
}
