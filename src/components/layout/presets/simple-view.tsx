import { ReactNode } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";

import SimpleHeader from "./simple-header";
import { UNSAFE_useScrollRestoration } from "react-router-dom";

export default function SimpleView({
  children,
  actions,
  title,
  as,
  flush,
  gap,
  maxW,
  center,
  scroll = true,
  ...props
}: Omit<FlexProps, "title"> & {
  flush?: boolean;
  actions?: ReactNode;
  title?: ReactNode;
  center?: boolean;
  scroll?: boolean;
}) {
  const content = (
    <Flex
      direction="column"
      px={flush ? 0 : "4"}
      pt={flush ? 0 : "4"}
      pb={flush ? 0 : "max(1rem, var(--safe-bottom))"}
      gap={gap || "2"}
      flexGrow={1}
      maxW={maxW}
      w={maxW ? "full" : "initial"}
      mx={center ? "auto" : undefined}
    >
      {children}
    </Flex>
  );

  UNSAFE_useScrollRestoration;

  return (
    <Flex as={as} flex={1} direction="column" pr="var(--safe-right)" pl="var(--safe-left)" overflow="hidden" {...props}>
      <SimpleHeader title={title}>{actions}</SimpleHeader>

      {scroll ? (
        <Flex flex={1} overflowY="auto" overflowX="hidden" direction="column">
          {content}
        </Flex>
      ) : (
        content
      )}
    </Flex>
  );
}
