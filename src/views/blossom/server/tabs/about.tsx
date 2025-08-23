import { Button, Card, CardBody, CardHeader, Flex, Heading, Link, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";

import { mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { useEventStore, useObservableMemo } from "applesauce-react/hooks";
import BlossomServerFavicon from "../../../../components/blossom/blossom-server-favicon";
import ScrollLayout from "../../../../components/layout/presets/scroll-layout";
import RouterLink from "../../../../components/router-link";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import pool from "../../../../services/pool";
import BlossomServerReview from "../components/blossom-server-review";
import useServerUrlParam from "../use-server-url-param";
import { BLOSSOM_SERVER_REVIEW_KIND } from "./reviews";

const B = ({ children }: { children: React.ReactNode }) => (
  <Text as="span" fontWeight="bold">
    {children}
  </Text>
);

function BlossomDetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card variant="outline">
      <CardHeader pb="2">
        <Heading size="sm">{title}</Heading>
      </CardHeader>
      <CardBody pt="0">{children}</CardBody>
    </Card>
  );
}

function BlossomServerPage({ server }: { server: string }) {
  const serverUrl = useMemo(() => new URL(server), [server]);
  const readRelays = useReadRelays();
  const eventStore = useEventStore();

  const httpsUrl = useMemo(() => {
    const url = new URL(server);
    url.protocol = "https:";
    return url.toString();
  }, [server]);

  // Load latest 4 reviews
  const reviews = useObservableMemo(
    () =>
      pool
        .request(readRelays, {
          kinds: [BLOSSOM_SERVER_REVIEW_KIND],
          "#d": [server],
          limit: 10,
        })
        .pipe(mapEventsToStore(eventStore), mapEventsToTimeline()),
    [readRelays, server, eventStore],
  );

  return (
    <ScrollLayout maxW="6xl" center>
      <VStack spacing="6" align="stretch">
        {/* Header Section */}
        <Card variant="outline">
          <CardBody>
            <Flex gap="4" alignItems="center" wrap="wrap">
              <BlossomServerFavicon server={server} size="lg" />
              <VStack align="flex-start" spacing="2" flex="1" minW="0">
                <Heading size={{ base: "md", sm: "lg" }} isTruncated>
                  {serverUrl.hostname}
                </Heading>
                <Text color="gray.500">Blossom Media Server</Text>
              </VStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Two-column layout for details */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="6">
          {/* Basic Information */}
          <BlossomDetailCard title="Server Information">
            <VStack align="stretch" spacing="2">
              <Flex>
                <B>Hostname:</B>
                <Text ml="2">{serverUrl.hostname}</Text>
              </Flex>
              <Flex>
                <B>Protocol:</B>
                <Text ml="2">{serverUrl.protocol.replace(":", "")}</Text>
              </Flex>
              {serverUrl.port && (
                <Flex>
                  <B>Port:</B>
                  <Text ml="2">{serverUrl.port}</Text>
                </Flex>
              )}
              <Flex>
                <B>Type:</B>
                <Text ml="2">Blossom Media Server</Text>
              </Flex>
            </VStack>
          </BlossomDetailCard>

          {/* Connection Details */}
          <BlossomDetailCard title="Connection Details">
            <VStack align="stretch" spacing="2">
              <Flex>
                <B>Server URL:</B>
                <Text ml="2" isTruncated>
                  {server}
                </Text>
              </Flex>
              <Flex>
                <B>Web Interface:</B>
                <Link ml="2" href={httpsUrl} isExternal color="blue.500">
                  {httpsUrl}
                </Link>
              </Flex>
            </VStack>
          </BlossomDetailCard>
        </SimpleGrid>

        {/* Latest Reviews */}
        {reviews && reviews.length > 0 && (
          <BlossomDetailCard title="Latest Reviews">
            <VStack align="stretch" spacing="3">
              {reviews.map((event) => (
                <BlossomServerReview key={event.id} event={event} />
              ))}
              <Button
                as={RouterLink}
                to={`/blossom/${encodeURIComponent(server)}/reviews`}
                variant="outline"
                size="sm"
                alignSelf="flex-start"
              >
                View All Reviews
              </Button>
            </VStack>
          </BlossomDetailCard>
        )}
      </VStack>
    </ScrollLayout>
  );
}

export default function BlossomAboutView() {
  const server = useServerUrlParam();
  return <BlossomServerPage server={server} />;
}
