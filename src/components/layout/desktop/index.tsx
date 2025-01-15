import { Flex } from "@chakra-ui/react";
import { Outlet, ScrollRestoration } from "react-router-dom";

import DesktopSideNav from "./side-nav";
import ConnectionStatus from "../connection-status";
import { ErrorBoundary } from "../../error-boundary";

export default function DesktopLayout() {
  return (
    <>
      <ScrollRestoration />
      <ConnectionStatus />
      <Flex
        direction={{
          base: "column",
          md: "row",
        }}
        overflow="hidden"
        h="full"
      >
        <DesktopSideNav />
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Flex>
    </>
  );
}
