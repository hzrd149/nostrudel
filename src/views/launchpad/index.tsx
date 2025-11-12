import { Button, Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, SimpleGrid } from "@chakra-ui/react";

import RequireActiveAccount from "../../components/router/require-active-account";
import { ErrorBoundary } from "../../components/error-boundary";
import SimpleView from "../../components/layout/presets/simple-view";
import SearchForm from "./components/search-form";
import NotificationsCard from "./components/notifications-card";
import ToolsCard from "./components/tools-card";
import StreamsCard from "./components/streams-card";
import RouterLink from "../../components/router-link";
import { BuiltInFeedCards, ListFeedCards } from "../feeds";

function FeedsCard({ ...props }: Omit<CardProps, "children">) {
  return (
    <Card variant="outline" {...props}>
      <CardHeader display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="md">
          <Link as={RouterLink} to="/feeds">
            Feeds
          </Link>
        </Heading>
      </CardHeader>
      <CardBody p="0" overflowY="auto" maxH="50vh" borderTopWidth={1}>
        <BuiltInFeedCards />
        <Button as={RouterLink} to="/feeds" w="full" flexShrink={0} variant="link" size="lg" py="4">
          View More
        </Button>
      </CardBody>
    </Card>
  );
}

function ListsCard({ ...props }: Omit<CardProps, "children">) {
  return (
    <Card variant="outline" {...props}>
      <CardHeader display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="md">
          <Link as={RouterLink} to="/lists">
            Lists
          </Link>
        </Heading>
      </CardHeader>
      <CardBody p="0" overflowY="auto" maxH="50vh" borderTopWidth={1}>
        <SimpleGrid columns={{ base: 1, xl: 2 }}>
          <ListFeedCards />
        </SimpleGrid>
        <Button as={RouterLink} to="/lists" w="full" flexShrink={0} variant="link" size="lg" py="4">
          View More
        </Button>
      </CardBody>
    </Card>
  );
}

function LaunchpadPage() {
  return (
    <SimpleView title="Launchpad">
      <SearchForm flex="0 0 auto" p={{ base: 0, lg: 2 }} />

      <Flex gap="4" direction="row" wrap="wrap" flex={1} overflow="hidden" p={{ base: 0, lg: 2 }}>
        <ErrorBoundary>
          <FeedsCard w={{ base: "full", md: "40%" }} maxH="30vh" />
        </ErrorBoundary>
        <ErrorBoundary>
          <ListsCard w={{ base: "full", md: "calc(60% - 1rem)" }} maxH="30vh" />
        </ErrorBoundary>
        <ErrorBoundary>
          <NotificationsCard w="full" maxH="40vh" />
        </ErrorBoundary>
        <ErrorBoundary>
          <StreamsCard w={{ base: "full", md: "40%" }} />
        </ErrorBoundary>
        <ErrorBoundary>
          <ToolsCard w={{ base: "full", md: "calc(60% - 1rem)" }} />
        </ErrorBoundary>
      </Flex>
    </SimpleView>
  );
}

export default function LaunchpadView() {
  return (
    <RequireActiveAccount>
      <LaunchpadPage />
    </RequireActiveAccount>
  );
}
