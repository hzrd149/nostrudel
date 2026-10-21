import { Box, Flex, FlexProps } from "@chakra-ui/react";
import { useCallback, useState } from "react";

import useScrollRestoreRef from "../hooks/use-scroll-restore";
import { ScrollContainerContext } from "../providers/local/scroll-container";

type VerticalPageLayoutProps = Omit<FlexProps, "as">;

/** The page's single `main` landmark; `as` is pinned so callers cannot replace it */
export default function VerticalPageLayout({ children, ...props }: VerticalPageLayoutProps) {
  const restoreRef = useScrollRestoreRef();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      restoreRef(el);
      setContainer(el);
    },
    [restoreRef],
  );

  return (
    <Box overflowX="hidden" overflowY="auto" h="full" w="full" ref={ref} tabIndex={0} aria-label="Main content">
      <ScrollContainerContext.Provider value={container}>
        <Flex direction="column" pt="2" pb="12" gap="2" px="2" w="full" {...props} as="main">
          {children}
        </Flex>
      </ScrollContainerContext.Provider>
    </Box>
  );
}
