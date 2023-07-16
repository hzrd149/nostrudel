import React from "react";
import { Container, Flex } from "@chakra-ui/react";
import { ErrorBoundary } from "../error-boundary";

import { useIsMobile } from "../../hooks/use-is-mobile";
import { ReloadPrompt } from "../reload-prompt";
import DesktopSideNav from "./desktop-side-nav";
import MobileBottomNav from "./mobile-bottom-nav";

export default function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <>
      <ReloadPrompt mb="2" />
      <Container size="lg" display="flex" padding="0" gap="4" alignItems="flex-start">
        {!isMobile && <DesktopSideNav position="sticky" top="0" />}
        <Flex flexGrow={1} direction="column" w="full" overflowX="hidden" overflowY="visible" pb={isMobile ? "14" : 0}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Flex>
        {isMobile && (
          <MobileBottomNav
            position="fixed"
            bottom="0"
            left="0"
            right="0"
            backgroundColor="var(--chakra-colors-chakra-body-bg)"
            zIndex={10}
          />
        )}
      </Container>
    </>
  );
}
