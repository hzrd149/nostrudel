import { ReactNode } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";

import SimpleHeader from "../components/simple-header";

/** @deprecated use single view with scroll=false */
export default function ContainedSimpleView({
  children,
  actions,
  title,
  as,
  flush,
  gap,
  reverse,
  bottom,
  ...props
}: Omit<FlexProps, "title" | "bottom"> & {
  flush?: boolean;
  actions?: ReactNode;
  title?: ReactNode;
  reverse?: boolean;
  bottom?: ReactNode;
}) {
  return (
    <Flex
      className="contained-simple-view"
      as={as}
      direction="column"
      pr="var(--safe-right)"
      pl="var(--safe-left)"
      h="100vh"
      overflow="hidden"
      w="full"
      {...props}
    >
      <SimpleHeader title={title}>{actions}</SimpleHeader>

      <Flex
        direction={reverse ? "column-reverse" : "column"}
        px={flush ? 0 : "4"}
        pt={flush ? 0 : "4"}
        pb={flush ? 0 : "max(1rem, var(--safe-bottom))"}
        gap={gap || "2"}
        flexGrow={1}
        h={0}
        overflowX="hidden"
        overflowY="auto"
      >
        {children}
      </Flex>

      {bottom}
    </Flex>
  );
}
