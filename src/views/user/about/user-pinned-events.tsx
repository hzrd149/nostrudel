import { Button, Flex, Heading, useDisclosure } from "@chakra-ui/react";

import { useAdditionalRelayContext } from "../../../providers/local/additional-relay-context";
import useUserPinList from "../../../hooks/use-user-pin-list";
import { EmbedEventPointer } from "../../../components/embed-event";

export default function UserPinnedEvents({ pubkey }: { pubkey: string }) {
  const contextRelays = useAdditionalRelayContext();
  const { pointers } = useUserPinList(pubkey, contextRelays, { alwaysRequest: true });
  const showAll = useDisclosure();

  if (pointers.length === 0) return null;

  return (
    <Flex direction="column" gap="2">
      <Heading size="md" my="2">
        Pinned
      </Heading>
      {(showAll.isOpen ? pointers : pointers.slice(0, 2)).map((pointer) => (
        <EmbedEventPointer key={JSON.stringify(pointer.data)} pointer={pointer} />
      ))}
      {!showAll.isOpen && pointers.length > 2 && (
        <Button variant="link" pt="4" onClick={showAll.onOpen}>
          Show All
        </Button>
      )}
    </Flex>
  );
}
