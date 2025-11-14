import { Button, Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, SimpleGrid } from "@chakra-ui/react";

import { ErrorBoundary } from "../../components/error-boundary";
import SimpleView from "../../components/layout/presets/simple-view";
import RouterLink from "../../components/router-link";
import RequireActiveAccount from "../../components/router/require-active-account";
import { BuiltInFeedCards, ListFeedCards } from "../feeds";
import SearchForm from "./components/search-form";
import StreamsCard from "./components/streams-card";
import ToolsCard from "./components/tools-card";
import MentionsCard from "./components/mentions-card";
import ZapsCard from "./components/zaps-card";

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
          <ListsCard w={{ base: "full", md: "calc(60% - 1rem)" }} maxH={{ base: "80vh", xl: "30vh" }} />
        </ErrorBoundary>
        <ErrorBoundary>
          <FeedsCard w={{ base: "full", md: "40%" }} maxH={{ base: "80vh", xl: "30vh" }} />
        </ErrorBoundary>
        <ErrorBoundary>
          <ZapsCard w={{ base: "full", md: "40%" }} maxH="30vh" />
        </ErrorBoundary>
        <ErrorBoundary>
          <MentionsCard w={{ base: "full", md: "calc(60% - 1rem)" }} maxH="30vh" />
        </ErrorBoundary>
        <ErrorBoundary>
          <StreamsCard w={{ base: "full", md: "40%" }} maxH="50vh" />
        </ErrorBoundary>
        <ErrorBoundary>
          <ToolsCard w={{ base: "full", md: "calc(60% - 1rem)" }} maxH="50vh" />
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
