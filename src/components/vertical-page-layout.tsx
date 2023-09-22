import { Flex, FlexProps } from "@chakra-ui/react";

export default function VerticalPageLayout({ children, ...props }: FlexProps) {
  return (
    <Flex direction="column" pt="2" pb="12" gap="2" px="2" {...props}>
      {children}
    </Flex>
  );
}
