import { Button, Flex, Text } from "@chakra-ui/react";
import { useState } from "react";
import MessageDecryptionMode from "../../../../components/message-decryption-mode";
import useAsyncAction from "../../../../hooks/use-async-action";
import useMessaging from "../../../../hooks/use-messaging";

export default function ClientStatus() {
  const session = useMessaging();
  const [indexed, setIndexed] = useState<number>();
  const index = useAsyncAction(async () => {
    if (!session) return;
    const legacy = await session.legacy.indexConversations();
    const wrapped = await session.wrapped.indexConversations();
    setIndexed(legacy + wrapped);
  }, [session]);
  return (
    <Flex direction="column" gap="2">
      <MessageDecryptionMode />
      <Flex gap="2" align="center">
        <Button onClick={index.run} isLoading={index.loading} isDisabled={!session}>
          Index saved messages
        </Button>
        {indexed !== undefined && <Text>{indexed} indexed</Text>}
      </Flex>
    </Flex>
  );
}
