import React from "react";
import { Box, Container, Flex, Spacer } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import { ErrorBoundary } from "../error-boundary";
import { ReloadPrompt } from "../reload-prompt";
import DesktopSideNav from "./desktop-side-nav";
import MobileBottomNav from "./mobile-bottom-nav";
import accountService from "../../services/account";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import GhostSideBar from "./ghost/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isGhost = useObservable(accountService.isGhost);

  return (
    <>
      <ReloadPrompt mb="2" />
      <Flex direction={{ base: "column", md: "row" }} minH="100vh">
        <Spacer display={["none", null, "block"]} />
        {!isMobile && <DesktopSideNav position="sticky" top="0" flexShrink={0} />}
        <Container
          // set base to "md" so that when layout switches to column it is full width
          size={{ base: "md", md: "md", lg: "lg", xl: "xl", "2xl": "2xl" }}
          display="flex"
          flexGrow={1}
          padding="0"
          flexDirection="column"
          mx="0"
          pb={isMobile ? "14" : 0}
          minH="50vh"
          overflow="hidden"
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </Container>
        {!isMobile && isGhost ? <GhostSideBar maxW="lg" minW="md" /> : <Box flexShrink={1} maxW="15rem" flex={1} />}
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
        <Spacer display={["none", null, "block"]} />
      </Flex>
    </>
  );
}
