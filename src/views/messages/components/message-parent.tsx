import { Text } from "@chakra-ui/react";
import type { WrappedConversation } from "applesauce-extra/messages";
import { use$ } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";

export default function MessageParent({ conversation, id }: { conversation: WrappedConversation; id: string }) {
  const message = use$(() => conversation.rumorStore.event(id), [conversation, id]);
  return (
    <Text borderLeftWidth="2px" pl="2" noOfLines={2} color="GrayText">
      {message ? (message.kind === kinds.FileMessage ? "Attachment" : message.content) : "Message unavailable"}
    </Text>
  );
}
