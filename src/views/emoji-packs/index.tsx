import { Button, Divider, Flex, Heading, Link, SimpleGrid, Spacer } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { useCurrentAccount } from "../../hooks/use-current-account";
import { ExternalLinkIcon } from "../../components/icons";
import { getEventCoordinate, getEventUID } from "../../helpers/nostr/events";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { EMOJI_PACK_KIND, getPackCordsFromFavorites } from "../../helpers/nostr/emoji-packs";
import useSubject from "../../hooks/use-subject";
import EmojiPackCard from "./components/emoji-pack-card";
import useFavoriteEmojiPacks from "../../hooks/use-favorite-emoji-packs";
import useReplaceableEvents from "../../hooks/use-replaceable-events";

function UserEmojiPackMangerPage() {
  const account = useCurrentAccount()!;

  const favoritePacks = useFavoriteEmojiPacks(account.pubkey);
  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(
    `${account.pubkey}-emoji-packs`,
    readRelays,
    {
      authors: [account.pubkey],
      kinds: [EMOJI_PACK_KIND],
    },
    { enabled: !!account.pubkey },
  );

  const favorites = useReplaceableEvents(favoritePacks && getPackCordsFromFavorites(favoritePacks));
  const packs = useSubject(timeline.timeline).filter((pack) => {
    const cord = getEventCoordinate(pack);
    return !favorites.some((e) => getEventCoordinate(e) === cord);
  });

  return (
    <>
      {favorites.length > 0 && (
        <>
          <Heading size="md" mt="2">
            Favorite packs
          </Heading>
          <Divider />
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
            {favorites.map((event) => (
              <EmojiPackCard key={getEventUID(event)} pack={event} />
            ))}
          </SimpleGrid>
        </>
      )}
      {packs.length > 0 && (
        <>
          <Heading size="md" mt="2">
            Emoji packs
          </Heading>
          <Divider />
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

export default function EmojiPacksView() {
  const account = useCurrentAccount();

  return (
    <Flex direction="column" pt="2" pb="10" gap="2" px={["2", "2", 0]}>
      <Flex gap="2">
        <Button as={RouterLink} to="/emojis/browse">
          Find packs
        </Button>
        <Spacer />
        <Button as={Link} href="https://emojis-iota.vercel.app/" isExternal rightIcon={<ExternalLinkIcon />}>
          Emoji pack manager
        </Button>
      </Flex>

      {account && <UserEmojiPackMangerPage />}
    </Flex>
  );
}
