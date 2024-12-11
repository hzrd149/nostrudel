import {
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  Image,
  Link,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { getEmojis, getPackName } from "applesauce-core/helpers/emoji";

import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";
import EmojiPackFavoriteButton from "../../../views/emoji-packs/components/emoji-pack-favorite-button";
import EmojiPackMenu from "../../../views/emoji-packs/components/emoji-pack-menu";
import { NostrEvent } from "../../../types/nostr-event";
import Timestamp from "../../timestamp";
import { getSharableEventAddress } from "../../../services/relay-hints";

export default function EmbeddedEmojiPack({ pack, ...props }: Omit<CardProps, "children"> & { pack: NostrEvent }) {
  const emojis = getEmojis(pack);
  const naddr = getSharableEventAddress(pack);

  return (
    <Card {...props}>
      <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
        <Heading size="md">
          <Link as={RouterLink} to={`/emojis/${naddr}`}>
            {getPackName(pack)}
          </Link>
        </Heading>
        <Text>by</Text>
        <UserAvatarLink pubkey={pack.pubkey} size="xs" />
        <UserLink pubkey={pack.pubkey} isTruncated fontWeight="bold" fontSize="md" />
        <ButtonGroup size="sm" ml="auto">
          <EmojiPackFavoriteButton pack={pack} />
          <EmojiPackMenu pack={pack} aria-label="emoji pack menu" />
        </ButtonGroup>
      </CardHeader>
      <CardBody p="2">
        {emojis.length > 0 && (
          <Flex mb="2" wrap="wrap" gap="2">
            {emojis.map(({ name, url }) => (
              <Image key={name + url} src={url} title={name} alt={`:${name}:`} w={8} h={8} overflow="hidden" />
            ))}
          </Flex>
        )}
      </CardBody>
      <CardFooter p="2" display="flex" pt="0">
        <Text>
          Updated: <Timestamp timestamp={pack.created_at} />
        </Text>
      </CardFooter>
    </Card>
  );
}
