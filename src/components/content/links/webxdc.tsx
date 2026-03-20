import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  Link,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { lazy, Suspense } from "react";

import { NostrEvent } from "nostr-tools";
import { isWebxdcUrl } from "../../../helpers/nostr/webxdc";
import { ErrorBoundary } from "../../error-boundary";
import ExpandableEmbed from "../components/content-embed";

// Lazy-load the player to avoid pulling JSZip into the main bundle
const WebxdcPlayer = lazy(() => import("../../../views/webxdc/components/webxdc-player"));

/**
 * Inline embed for webxdc apps shared as plain .xdc URLs in note content.
 * When the URL is accompanied by a kind 1063 event, the detail view is better,
 * but this handles bare URLs posted as kind 1 notes (as per NIP-DC attachment spec).
 */
function EmbeddedWebxdcUrl({ src }: { src: string }) {
  const play = useDisclosure();

  return (
    <Card variant="outline">
      <CardHeader p="2" pb="2" display="flex" alignItems="center" gap="2">
        <Flex direction="column" flex="1" minW="0">
          <Heading size="sm">Webxdc App</Heading>
          <Text fontSize="xs" color="gray.500" noOfLines={1}>
            {src}
          </Text>
        </Flex>
        <Button size="sm" colorScheme={play.isOpen ? undefined : "primary"} onClick={play.onToggle} flexShrink={0}>
          {play.isOpen ? "Close" : "Launch"}
        </Button>
      </CardHeader>
      {play.isOpen && (
        <CardBody px="2" pt="0" pb="2" overflow="hidden" whiteSpace="initial">
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              {/* Create a minimal synthetic event so the player can work with a bare URL */}
              <WebxdcPlayer
                event={
                  {
                    id: "",
                    pubkey: "",
                    sig: "",
                    kind: 1063,
                    created_at: 0,
                    content: "",
                    tags: [
                      ["url", src],
                      ["m", "application/x-webxdc"],
                    ],
                  } as NostrEvent
                }
                height="500px"
              />
            </Suspense>
          </ErrorBoundary>
        </CardBody>
      )}
      <CardFooter p="2" pt="0">
        <Link isExternal href={src} color="blue.500" fontSize="sm">
          {src}
        </Link>
      </CardFooter>
    </Card>
  );
}

export function renderWebxdcUrl(match: URL) {
  if (!isWebxdcUrl(match)) return null;

  return (
    <ExpandableEmbed label="Webxdc App" url={match} hideOnDefaultOpen>
      <EmbeddedWebxdcUrl src={match.toString()} />
    </ExpandableEmbed>
  );
}
