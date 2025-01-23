import { PropsWithChildren, ReactNode, Suspense } from "react";
import { Outlet, useMatch } from "react-router-dom";
import { Flex, Spinner } from "@chakra-ui/react";

import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import SimpleHeader from "./simple-header";
import { ErrorBoundary } from "../../error-boundary";

export default function ContainedParentView({
  children,
  path,
  title,
  width = "xs",
  actions,
}: PropsWithChildren<{ path: string; title?: string; width?: "xs" | "sm" | "md"; actions?: ReactNode }>) {
  const match = useMatch(path);
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const showMenu = !isMobile || !!match;

  return (
    <Flex data-type="contained-view" h="100vh" overflow="hidden" direction={{ base: "column", lg: "row" }}>
      {showMenu && (
        <Flex
          w={{ base: "full", lg: width }}
          direction="column"
          overflowY="auto"
          overflowX="hidden"
          h="full"
          flexShrink={0}
        >
          {title && <SimpleHeader title={title}>{actions}</SimpleHeader>}
          <Flex direction="column" p="2" gap="2">
            {children}
          </Flex>
        </Flex>
      )}
      <Suspense fallback={<Spinner />}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Suspense>
    </Flex>
  );
}
