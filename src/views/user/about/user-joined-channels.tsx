import { Button, Flex, Heading, SimpleGrid, useDisclosure } from "@chakra-ui/react";

import { ErrorBoundary } from "../../../components/error-boundary";
import useUserChannelsList from "../../../hooks/use-user-channels-list";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import { PointerChannelCard } from "../../channels/components/channel-card";

export default function UserJoinedChannels({ pubkey }: { pubkey: string }) {
  const { pointers: channels } = useUserChannelsList({ pubkey });
  const columns = useBreakpointValue({ base: 1, lg: 2, xl: 3 }) ?? 1;
  const showAll = useDisclosure();

  if (channels.length === 0) return null;

  return (
    <Flex direction="column" px="2">
      <Heading size="md" my="2">
        Joined Channels ({channels.length})
      </Heading>
      <SimpleGrid spacing="4" columns={columns}>
        {(showAll.isOpen ? channels : channels.slice(0, columns * 2)).map((pointer) => (
          <ErrorBoundary key={pointer.id}>
            <PointerChannelCard pointer={pointer} />
          </ErrorBoundary>
        ))}
      </SimpleGrid>
      {!showAll.isOpen && channels.length > columns * 2 && (
        <Button variant="link" pt="4" onClick={showAll.onOpen}>
          Show All
        </Button>
      )}
    </Flex>
  );
}
