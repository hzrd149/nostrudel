import { Button, Container, Flex, IconButton } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import VerticalPageLayout from "../../components/vertical-page-layout";
import RequireCurrentAccount from "../../providers/route/require-current-account";
import AccountSwitcher from "../../components/layout/account-switcher";
import { SettingsIcon } from "../../components/icons";
import { ErrorBoundary } from "../../components/error-boundary";
import FeedsCard from "./components/feeds-card";
import SearchForm from "./components/search-form";
import KeyboardShortcut from "../../components/keyboard-shortcut";
import DMsCard from "./components/dms-card";
import NotificationsCard from "./components/notifications-card";
import ToolsCard from "./components/tools-card";
import StreamsCard from "./components/streams-card";
import Plus from "../../components/icons/plus";

function LaunchpadPage() {
  return (
    <VerticalPageLayout gap="4" direction="row" wrap="wrap">
      <Flex justifyContent="space-between" w="full">
        <Flex gap="2">
          <AccountSwitcher />
          <Button
            as={RouterLink}
            colorScheme="primary"
            size="lg"
            to="/new"
            variant="outline"
            leftIcon={<Plus boxSize={6} />}
          >
            New
            <KeyboardShortcut letter="n" ml="2" />
          </Button>
        </Flex>
        <IconButton
          as={RouterLink}
          icon={<SettingsIcon boxSize={6} />}
          aria-label="Settings"
          title="Settings"
          size="lg"
          to="/settings"
        />
      </Flex>
      <SearchForm flex={1} />

      <ErrorBoundary>
        <FeedsCard w="full" />
      </ErrorBoundary>
      <ErrorBoundary>
        <NotificationsCard w={{ base: "full", md: "calc(60% - 1rem)" }} maxH="40vh" />
      </ErrorBoundary>
      <ErrorBoundary>
        <DMsCard w={{ base: "full", md: "40%" }} />
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
    <RequireCurrentAccount>
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
    </RequireCurrentAccount>
  );
}
