import { PropsWithChildren, Suspense } from "react";
import { Outlet, useMatch } from "react-router";
import { Box, Flex, FlexProps, Spinner } from "@chakra-ui/react";

import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import SimpleHeader from "./simple-header";
import { ErrorBoundary } from "../../error-boundary";

export default function ContainedParentView({
  children,
  path,
  title,
  width = "xs",
}: PropsWithChildren<{ path: string; title?: string; width?: FlexProps["w"]; contain?: boolean }>) {
  const match = useMatch(path);
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const showMenu = !isMobile || !!match;

  if (showMenu)
    return (
      <Flex flex={1} overflow="hidden" h="full">
        <Flex width={width} direction="column">
          {title && <SimpleHeader title={title} position="initial" />}
          <Flex direction="column" p="2" gap="2" overflowY="auto" overflowX="hidden">
            {children}
          </Flex>
        </Flex>
        {!isMobile && (
          <Suspense fallback={<Spinner />}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </Suspense>
        )}
      </Flex>
    );
  else
    return (
      <Suspense fallback={<Spinner />}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Suspense>
    );
}
