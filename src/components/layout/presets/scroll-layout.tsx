import { PropsWithChildren } from "react";
import { Box, Flex, FlexProps } from "@chakra-ui/react";

import useScrollRestoreRef from "../../../hooks/use-scroll-restore";

/** A simple layout that has a vertical scrollbar and a preserves scroll position on route change */
export default function ScrollLayout({
  children,
  key,
  center,
  gap = 2,
  flush,
  w = "full",
  maxW,
}: PropsWithChildren<{
  key?: string;
  center?: boolean;
  w?: FlexProps["w"];
  maxW?: FlexProps["maxW"];
  flush?: boolean;
  gap?: FlexProps["gap"];
}>) {
  const ref = useScrollRestoreRef(key);

  return (
    <Box flex={1} overflowY="auto" overflowX="hidden" ref={ref} w="full">
      {/* Wrap children in extra div so the content does not get squished */}
      <Flex
        direction="column"
        gap={gap}
        w={w}
        maxW={maxW}
        px={flush ? 0 : 2}
        pt={flush ? 0 : 2}
        pb={flush ? 0 : 10}
        mx={center ? "auto" : undefined}
      >
        {children}
      </Flex>
    </Box>
  );
}
