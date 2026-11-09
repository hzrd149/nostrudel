import { Box, Button, Flex, Radio, RadioGroup, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useState } from "react";
import useAsyncAction from "../../../../hooks/use-async-action";
import useMessaging from "../../../../hooks/use-messaging";

export default function ClientStatus() {
  const session = useMessaging();
  const auto = use$(() => session?.wrapped.receiver.autoUnlock$, [session]);
  const [indexed, setIndexed] = useState<number>();
  const index = useAsyncAction(async () => {
    if (!session) return;
    const legacy = await session.legacy.indexConversations();
    const wrapped = await session.wrapped.indexConversations();
    setIndexed(legacy + wrapped);
  }, [session]);
  return (
    <Flex direction="column" gap="2">
      <Text fontWeight="medium" id="message-decryption-label">
        Message decryption
      </Text>
      <RadioGroup
        aria-labelledby="message-decryption-label"
        value={auto ? "automatic" : "manual"}
        onChange={(value) => session?.setAutoUnlock(value === "automatic")}
      >
        <Flex gap="3" direction={{ base: "column", sm: "row" }}>
          <Box borderWidth="1px" borderColor={!auto ? "primary.500" : undefined} borderRadius="md" flex="1">
            <Radio value="manual" colorScheme="primary" isDisabled={!session} w="full" p="4">
              <Text fontWeight="medium">Manual</Text>
              <Text>Decrypt messages when you choose.</Text>
            </Radio>
          </Box>
          <Box borderWidth="1px" borderColor={auto ? "primary.500" : undefined} borderRadius="md" flex="1">
            <Radio value="automatic" colorScheme="primary" isDisabled={!session} w="full" p="4">
              <Text fontWeight="medium">Automatic</Text>
              <Text>Decrypt messages as they arrive.</Text>
            </Radio>
          </Box>
        </Flex>
      </RadioGroup>
      <Flex gap="2" align="center">
        <Button onClick={index.run} isLoading={index.loading} isDisabled={!session}>
          Index saved messages
        </Button>
        {indexed !== undefined && <Text>{indexed} indexed</Text>}
      </Flex>
    </Flex>
  );
}
