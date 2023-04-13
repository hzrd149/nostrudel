import React from "react";
import { Container, Flex } from "@chakra-ui/react";
import { ErrorBoundary } from "../error-boundary";

import { useIsMobile } from "../../hooks/use-is-mobile";
import { ReloadPrompt } from "../reload-prompt";
import { PostModalProvider } from "../../providers/post-modal-provider";
import DesktopSideNav from "./desktop-side-nav";
import MobileBottomNav from "./mobile-bottom-nav";

export const Page = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();

  return (
    <PostModalProvider>
      <Container
        size="lg"
        display="flex"
        flexDirection="column"
        height="100%"
        overflow="hidden"
        position="relative"
        padding="0"
      >
        <ReloadPrompt />
        <Flex gap="4" grow={1} overflow="hidden">
          {!isMobile && <DesktopSideNav />}
          <Flex flexGrow={1} direction="column" overflow="hidden">
            <ErrorBoundary>{children}</ErrorBoundary>
          </Flex>
        </Flex>
        {isMobile && <MobileBottomNav />}
      </Container>
    </PostModalProvider>
  );
};
