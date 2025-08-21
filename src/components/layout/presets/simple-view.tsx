import { Flex, FlexProps } from "@chakra-ui/react";
import { type ReactNode } from "react";

import { ErrorBoundary } from "../../error-boundary";
import ScrollLayout from "./scroll-layout";
import SimpleHeader from "../components/simple-header";

export default function SimpleView({
  children,
  actions,
  icon,
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
  icon?: ReactNode;
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

  return (
    <Flex
      data-type="simple-view"
      as={as}
      flex={1}
      direction="column"
      pr="var(--safe-right)"
      pl="var(--safe-left)"
      overflow="hidden"
      {...props}
    >
      <SimpleHeader title={title} icon={icon}>
        {actions}
      </SimpleHeader>

      <ErrorBoundary>
        {scroll ? (
          <ScrollLayout maxW={maxW} center={center} flush={flush}>
            {children}
          </ScrollLayout>
        ) : (
          content
        )}
      </ErrorBoundary>
    </Flex>
  );
}
