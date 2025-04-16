import { Button, Flex, Heading, Link, SimpleGrid, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { kinds } from "nostr-tools";
import { getAddressPointersFromList } from "applesauce-core/helpers";

import { useActiveAccount } from "applesauce-react/hooks";
import { ExternalLinkIcon } from "../../components/icons";
import { getEventCoordinate, getEventUID } from "../../helpers/nostr/event";
import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import EmojiPackCard from "./components/emoji-pack-card";
import useFavoriteEmojiPacks from "../../hooks/use-favorite-emoji-packs";
import useReplaceableEvents from "../../hooks/use-replaceable-events";
import EmojiPackCreateModal from "./components/create-modal";
import VerticalPageLayout from "../../components/vertical-page-layout";

function UserEmojiPackMangerPage() {
  const account = useActiveAccount()!;

  const favoritePacks = useFavoriteEmojiPacks(account.pubkey);
  const readRelays = useReadRelays();
  const { timeline: packs } = useTimelineLoader(
    `${account.pubkey}-emoji-packs`,
    readRelays,
    account.pubkey
      ? {
          authors: [account.pubkey],
          kinds: [kinds.Emojisets],
        }
      : undefined,
  );

  const favorites = useReplaceableEvents(favoritePacks && getAddressPointersFromList(favoritePacks));
  const filtered = packs.filter((pack) => {
    const cord = getEventCoordinate(pack);
    return !favorites.some((e) => getEventCoordinate(e) === cord);
  });

  return (
    <>
      {favorites.length > 0 && (
        <>
          <Heading size="lg" mt="2">
            Favorite packs
          </Heading>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
            {favorites.map((event) => (
              <EmojiPackCard key={getEventUID(event)} pack={event} />
            ))}
          </SimpleGrid>
        </>
      )}
      {filtered.length > 0 && (
        <>
          <Heading size="lg" mt="2">
            Emoji packs
          </Heading>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
            {packs.map((event) => (
              <EmojiPackCard key={getEventUID(event)} pack={event} />
            ))}
          </SimpleGrid>
        </>
      )}
    </>
  );
}

export default function EmojisHomeView() {
  const account = useActiveAccount();
  const createModal = useDisclosure();

  return (
    <VerticalPageLayout>
      <Flex gap="2" wrap="wrap">
        <Button as={RouterLink} to="/emojis/browse">
          Find packs
        </Button>
        <Button as={Link} href="https://emojito.meme" isExternal rightIcon={<ExternalLinkIcon />} ml="auto">
          Emoji pack manager
        </Button>
        {account && (
          <Button colorScheme="primary" onClick={createModal.onOpen}>
            Create Emoji pack
          </Button>
        )}
      </Flex>

      {account && <UserEmojiPackMangerPage />}
      {createModal.isOpen && <EmojiPackCreateModal isOpen={createModal.isOpen} onClose={createModal.onClose} />}
    </VerticalPageLayout>
  );
}
