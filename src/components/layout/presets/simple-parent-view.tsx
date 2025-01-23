import { PropsWithChildren, Suspense } from "react";
import { Outlet, OutletProps, useMatch } from "react-router-dom";
import { Box, Flex, Spinner } from "@chakra-ui/react";

import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import SimpleHeader from "./simple-header";
import { ErrorBoundary } from "../../error-boundary";

export default function SimpleParentView({
  children,
  path,
  title,
  width = "xs",
  context,
}: PropsWithChildren<{ path: string; title?: string; width?: "xs" | "sm" | "md"; context?: OutletProps["context"] }>) {
  const match = useMatch(path);
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const showMenu = !isMobile || !!match;

  const floating = useBreakpointValue({ base: false, lg: true });

  if (showMenu)
    return (
      <Flex data-type="parent-view" flex={1} direction={floating ? "row" : "column"}>
        <Box w={floating ? width : 0} flexGrow={0} flexShrink={0} />
        <Flex
          w={{ base: "full", lg: width }}
          direction="column"
          position={floating ? "fixed" : "initial"}
          top="var(--safe-top)"
          bottom="var(--safe-bottom)"
        >
          {title && <SimpleHeader title={title} />}
          <Flex direction="column" p="2" gap="2" overflowY="auto" overflowX="hidden">
            {children}
          </Flex>
        </Flex>
        {!isMobile && (
          <Suspense fallback={<Spinner />}>
            <ErrorBoundary>
              <Outlet context={context} />
            </ErrorBoundary>
          </Suspense>
        )}
      </Flex>
    );
  else
    return (
      <Suspense fallback={<Spinner />}>
        <ErrorBoundary>
          <Outlet context={context} />
        </ErrorBoundary>
      </Suspense>
    );
}
