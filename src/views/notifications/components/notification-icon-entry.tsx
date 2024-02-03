import { Box, Flex } from "@chakra-ui/react";
import { PropsWithChildren, ReactNode, forwardRef } from "react";

const NotificationIconEntry = forwardRef<HTMLDivElement, PropsWithChildren<{ icon: ReactNode }>>(
  ({ children, icon }, ref) => {
    return (
      <Flex gap="2" ref={ref}>
        <Box px="2" pb="2">
          {icon}
        </Box>
        <Flex direction="column" w="full" gap="2" overflow="hidden">
          {children}
        </Flex>
      </Flex>
    );
  },
);

export default NotificationIconEntry;
