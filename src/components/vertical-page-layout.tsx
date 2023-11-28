import { ComponentWithAs, Flex, FlexProps } from "@chakra-ui/react";

const VerticalPageLayout: ComponentWithAs<"div", FlexProps> = ({ children, ...props }: FlexProps) => {
  return (
    <Flex direction="column" pt="2" pb="12" gap="2" px="2" {...props}>
      {children}
    </Flex>
  );
};

export default VerticalPageLayout;
