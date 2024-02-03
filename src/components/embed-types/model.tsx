import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  IconButton,
  Link,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "../error-boundary";
import { DownloadIcon, ThingsIcon } from "../icons";

const STLViewer = lazy(() => import("../stl-viewer"));

function EmbeddedStlFile({ src }: { src: string }) {
  const preview = useDisclosure();

  return (
    <Card variant="outline">
      <CardHeader p="2" display="flex" alignItems="center" gap="2">
        <ThingsIcon boxSize={6} />
        <Heading size="sm">STL File</Heading>
        <ButtonGroup size="sm" ml="auto">
          <IconButton icon={<DownloadIcon />} aria-label="Download File" title="Download File" />
          {!preview.isOpen && (
            <Button colorScheme="primary" onClick={preview.onOpen}>
              Preview
            </Button>
          )}
        </ButtonGroup>
      </CardHeader>
      {preview.isOpen && (
        <CardBody px="2" pt="0" pb="2">
          <Suspense
            fallback={
              <Text>
                <Spinner /> Loading viewer...
              </Text>
            }
          >
            <ErrorBoundary>
              <STLViewer aspectRatio={16 / 10} url={src} />
            </ErrorBoundary>
          </Suspense>
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

  return <EmbeddedStlFile src={match.toString()} />;
}
