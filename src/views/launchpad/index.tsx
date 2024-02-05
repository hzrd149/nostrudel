import { useContext } from "react";
import { Button, Container, Flex, IconButton } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import VerticalPageLayout from "../../components/vertical-page-layout";
import RequireCurrentAccount from "../../providers/route/require-current-account";
import { PostModalContext } from "../../providers/route/post-modal-provider";
import AccountSwitcher from "../../components/layout/account-switcher";
import { SettingsIcon } from "../../components/icons";
import { ErrorBoundary } from "../../components/error-boundary";
import FeedsCard from "./components/feeds-card";
import SearchForm from "./components/search-form";
import KeyboardShortcut from "../../components/keyboard-shortcut";
import DMsCard from "./components/dms-card";
import NotificationsCard from "./components/notifications-card";

function LaunchpadPage() {
  const { openModal } = useContext(PostModalContext);

  return (
    <VerticalPageLayout gap="4" direction="row" wrap="wrap">
      <Flex justifyContent="space-between" w="full">
        <AccountSwitcher />
        <IconButton
          as={RouterLink}
          icon={<SettingsIcon boxSize={6} />}
          aria-label="Settings"
          title="Settings"
          size="lg"
          borderRadius="50%"
          to="/settings"
        />
      </Flex>
      <Flex gap="4" w="full">
        <Button colorScheme="primary" size="lg" onClick={() => openModal()} variant="outline">
          New Note
          <KeyboardShortcut letter="n" ml="2" onPress={(e) => openModal()} />
        </Button>
        <SearchForm flex={1} />
      </Flex>
      <FeedsCard w="full" />
      <NotificationsCard w={{ base: "full", md: "calc(60% - 1rem)" }} />
      <DMsCard w={{ base: "full", md: "40%" }} />
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
