import React, { useEffect } from "react";
import { Box, Container, Flex, Spacer, useDisclosure } from "@chakra-ui/react";
import { useKeyPressEvent } from "react-use";

import { ErrorBoundary } from "../error-boundary";
import { ReloadPrompt } from "../reload-prompt";
import DesktopSideNav from "./desktop-side-nav";
import MobileBottomNav from "./mobile-bottom-nav";
import useSubject from "../../hooks/use-subject";
import accountService from "../../services/account";
import GhostToolbar from "./ghost-toolbar";
import { useBreakpointValue } from "../../providers/breakpoint-provider";
import SearchModal from "../search-modal";
import { useLocation } from "react-router-dom";
// import ChatWindows from "../chat-windows";

export default function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isGhost = useSubject(accountService.isGhost);
  const searchModal = useDisclosure();

  useKeyPressEvent("k", (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      searchModal.onOpen();
    }
  });

  const location = useLocation();
  useEffect(() => {
    searchModal.onClose();
  }, [location.pathname]);

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
        {!isMobile && <Box flexShrink={1} maxW="15rem" flex={1} />}
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
      {isGhost && <GhostToolbar />}
      {searchModal.isOpen && <SearchModal isOpen onClose={searchModal.onClose} />}
      {/* {!isMobile && <ChatWindows />} */}
    </>
  );
}
