import { Box, ComponentWithAs, Flex, FlexProps } from "@chakra-ui/react";

const VerticalPageLayout: ComponentWithAs<"div", FlexProps> = ({ children, ...props }: FlexProps) => {
  return (
    <Box overflowX="hidden" overflowY="auto" h="full" w="full">
      <Flex direction="column" pt="2" pb="12" gap="2" px="2" w="full" {...props}>
        {children}
      </Flex>
    </Box>
  );
};

export default VerticalPageLayout;
