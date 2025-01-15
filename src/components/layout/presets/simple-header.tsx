import { Flex, FlexProps, Heading } from "@chakra-ui/react";
import { BackIconButton } from "../../router/back-button";

export default function SimpleHeader({ children, title, ...props }: FlexProps) {
  return (
    <Flex
      p="2"
      borderBottom="1px solid var(--chakra-colors-chakra-border-color)"
      alignItems="center"
      gap="2"
      minH="14"
      mt="var(--safe-top)"
    >
      <BackIconButton hideFrom="lg" />
      <Heading fontWeight="bold" size="md" ml={{ base: 0, md: "2" }} whiteSpace="pre" isTruncated>
        {title}
      </Heading>
      {children}
    </Flex>
  );
}
