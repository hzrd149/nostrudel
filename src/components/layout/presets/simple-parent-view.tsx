import { PropsWithChildren, ReactNode, Suspense } from "react";
import { Outlet, OutletProps, useMatch } from "react-router-dom";
import { Flex, FlexProps, Spinner } from "@chakra-ui/react";

import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import SimpleHeader from "../components/simple-header";
import { ErrorBoundary } from "../../error-boundary";
import useScrollRestoreRef from "../../../hooks/use-scroll-restore";

export default function SimpleParentView({
  children,
  path,
  title,
  width = "xs",
  actions,
  padding = true,
  scroll = true,
  gap = 2,
  context,
}: PropsWithChildren<{
  path: string;
  title?: string;
  width?: "xs" | "sm" | "md";
  actions?: ReactNode;
  padding?: boolean;
  scroll?: boolean;
  gap?: FlexProps["gap"];
  context?: OutletProps["context"];
}>) {
  const match = useMatch(path);
  const isMobile = useBreakpointValue({ base: true, xl: false });
  const showMenu = !isMobile || !!match;

  const ref = useScrollRestoreRef("parent");

  return (
    <Flex data-type="parent-view" h="full" overflow="hidden" direction={{ base: "column", xl: "row" }}>
      {showMenu && (
        <Flex w={{ base: "full", lg: width }} direction="column" overflow="hidden" h="full" flexShrink={0}>
          {title && <SimpleHeader title={title}>{actions}</SimpleHeader>}
          {scroll ? (
            <Flex
              direction="column"
              p={padding ? "2" : undefined}
              gap={gap}
              overflowY={scroll ? "auto" : "hidden"}
              overflowX="hidden"
              flex={1}
              ref={ref}
            >
              {children}
            </Flex>
          ) : (
            <>{children}</>
          )}
        </Flex>
      )}
      {(!isMobile || !showMenu) && (
        <Suspense fallback={<Spinner />}>
          <ErrorBoundary>
            <Outlet context={context} />
          </ErrorBoundary>
        </Suspense>
      )}
    </Flex>
  );
}
