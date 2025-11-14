import { Divider, Flex, Heading } from "@chakra-ui/react";

export default function TimePeriodHeader({ label }: { label: string }) {
  return (
    <Flex gap="4" alignItems="center" mt="4" mb="2">
      <Divider w="10" flexShrink={0} />
      <Heading size="md" whiteSpace="nowrap">
        {label}
      </Heading>
      <Divider />
    </Flex>
  );
}
