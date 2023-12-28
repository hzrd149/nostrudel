import { useContext } from "react";
import { useKeyPressEvent } from "react-use";
import { Button, Code, Container, Flex, IconButton } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import VerticalPageLayout from "../../components/vertical-page-layout";
import RequireCurrentAccount from "../../providers/route/require-current-account";
import { PostModalContext } from "../../providers/route/post-modal-provider";
import AccountSwitcher from "../../components/layout/account-switcher";
import { SettingsIcon } from "../../components/icons";
import { ErrorBoundary } from "../../components/error-boundary";
import FeedsCard from "./components/feeds-card";
import SearchForm from "./components/search-form";

function LaunchpadPage() {
  const { openModal } = useContext(PostModalContext);

  useKeyPressEvent("n", () => !(document.activeElement instanceof HTMLInputElement) && openModal());

  return (
    <VerticalPageLayout gap="4">
      <Flex justifyContent="space-between">
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
      <Flex gap="4">
        <Button colorScheme="primary" size="lg" onClick={() => openModal()} variant="outline">
          New Note
          <Code ml="2" fontSize="lg" hideBelow="md">
            N
          </Code>
        </Button>
        <SearchForm flex={1} />
      </Flex>
      <FeedsCard />
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
