import { getEventUID } from "applesauce-core/helpers";
import { Button, Flex, Heading, Link, SimpleGrid, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { kinds } from "nostr-tools";

import { useActiveAccount, use$ } from "applesauce-react/hooks";
import { ExternalLinkIcon } from "../../components/icons";
import { getEventCoordinate } from "../../helpers/nostr/event";
import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import EmojiPackCard from "./components/emoji-pack-card";
import useCastUser from "../../hooks/use-cast-user";
import EmojiPackCreateModal from "./components/create-modal";
import VerticalPageLayout from "../../components/vertical-page-layout";

function UserEmojiPackMangerPage() {
  const account = useActiveAccount()!;

  const favorites = use$(useCastUser(account.pubkey).favoriteEmojis$.packs$) ?? [];
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

  const filtered = packs.filter((pack) => {
    const cord = getEventCoordinate(pack);
    return !favorites.some((favorite) => getEventCoordinate(favorite.event) === cord);
  });

  return (
    <>
      {favorites.length > 0 && (
        <>
          <Heading size="lg" mt="2">
            Favorite packs
          </Heading>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
            {favorites.map((favorite) => (
              <EmojiPackCard key={favorite.uid} pack={favorite.event} />
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
