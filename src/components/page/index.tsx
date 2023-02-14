import React from "react";
import { Container, Flex, Heading, VStack } from "@chakra-ui/react";
import { ErrorBoundary } from "../error-boundary";

import { useIsMobile } from "../../hooks/use-is-mobile";
import { FollowingList } from "../following-list";
import { ReloadPrompt } from "../reload-prompt";
import { PostModalProvider } from "../../providers/post-modal-provider";
import MobileHeader from "./mobile-header";
import DesktopSideNav from "./desktop-side-nav";
import MobileBottomNav from "./mobile-bottom-nav";

const FollowingSideNav = () => {
  return (
    <VStack width="15rem" pt="2" alignItems="stretch" flexShrink={0}>
      <Heading size="md">Following</Heading>
      <FollowingList />
    </VStack>
  );
};

export const Page = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();

  return (
    <Container
      size="lg"
      display="flex"
      flexDirection="column"
      height="100vh"
      overflow="hidden"
      position="relative"
      padding="0"
    >
      <ReloadPrompt />
      {isMobile && <MobileHeader />}
      <Flex gap="4" grow={1} overflow="hidden">
        {!isMobile && <DesktopSideNav />}
        <Flex flexGrow={1} direction="column" overflow="hidden">
          <ErrorBoundary>
            <PostModalProvider>{children}</PostModalProvider>
          </ErrorBoundary>
        </Flex>
        {!isMobile && <FollowingSideNav />}
      </Flex>
      {isMobile && <MobileBottomNav />}
    </Container>
  );
};
