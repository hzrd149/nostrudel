import { Box, Flex, FlexProps } from "@chakra-ui/react";
import useScrollRestoreRef from "../hooks/use-scroll-restore";

type VerticalPageLayoutProps = Omit<FlexProps, "as">;

/** The page's single `main` landmark; `as` is pinned so callers cannot replace it */
export default function VerticalPageLayout({ children, ...props }: VerticalPageLayoutProps) {
  const ref = useScrollRestoreRef();

  return (
    <Box overflowX="hidden" overflowY="auto" h="full" w="full" ref={ref} tabIndex={0} aria-label="Main content">
      <Flex direction="column" pt="2" pb="12" gap="2" px="2" w="full" {...props} as="main">
        {children}
      </Flex>
    </Box>
  );
}
