import { Container } from "@chakra-ui/react";

import VerticalPageLayout from "../../components/vertical-page-layout";
import RequireActiveAccount from "../../components/router/require-active-account";
import { ErrorBoundary } from "../../components/error-boundary";
import FeedsCard from "./components/feeds-card";
import SearchForm from "./components/search-form";
import NotificationsCard from "./components/notifications-card";
import ToolsCard from "./components/tools-card";
import StreamsCard from "./components/streams-card";

function LaunchpadPage() {
  return (
    <VerticalPageLayout gap="4" direction="row" wrap="wrap">
      <SearchForm flex={1} />

      <ErrorBoundary>
        <FeedsCard w="full" />
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
    </VerticalPageLayout>
  );
}

export default function LaunchpadView() {
  return (
    <RequireActiveAccount>
      <Container
        // set base to "md" so that when layout switches to column it is full width
        size={{ base: "md", md: "md", lg: "lg", xl: "xl", "2xl": "2xl" }}
        display="flex"
        flexGrow={1}
        padding="0"
        flexDirection="column"
        mx="auto"
        minH="50vh"
        overflow="hidden"
      >
        <ErrorBoundary>
          <LaunchpadPage />
        </ErrorBoundary>
      </Container>
    </RequireActiveAccount>
  );
}
