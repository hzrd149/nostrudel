import { Button, Flex, Heading, useDisclosure } from "@chakra-ui/react";
import { getCoordinateFromAddressPointer, isEventPointer } from "applesauce-core/helpers";

import { useAdditionalRelayContext } from "../../../providers/local/additional-relay";
import useUserPinList from "../../../hooks/use-user-pin-list";
import { EmbedEventPointerCard } from "../../../components/embed-event/card";

export default function UserPinnedEvents({ pubkey }: { pubkey: string }) {
  const contextRelays = useAdditionalRelayContext();
  const { pointers } = useUserPinList(pubkey, contextRelays, true);
  const showAll = useDisclosure();

  if (pointers.length === 0) return null;

  return (
    <Flex direction="column" gap="2">
      <Heading size="md" my="2">
        Pinned
      </Heading>
      {(showAll.isOpen ? pointers : pointers.slice(0, 2)).map((pointer) => (
        <EmbedEventPointerCard
          key={isEventPointer(pointer) ? pointer.id : getCoordinateFromAddressPointer(pointer)}
          pointer={isEventPointer(pointer) ? { type: "nevent", data: pointer } : { type: "naddr", data: pointer }}
        />
      ))}
      {!showAll.isOpen && pointers.length > 2 && (
        <Button variant="link" pt="4" onClick={showAll.onOpen}>
          Show All
        </Button>
      )}
    </Flex>
  );
}
