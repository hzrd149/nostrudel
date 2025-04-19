import { Link as RouterLink } from "react-router-dom";
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
  Text,
} from "@chakra-ui/react";
import { getEmojis, getPackName } from "applesauce-core/helpers/emoji";

import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { NostrEvent } from "nostr-tools";
import EmojiPackFavoriteButton from "./emoji-pack-favorite-button";
import EmojiPackMenu from "./emoji-pack-menu";
import EventZapButton from "../../../components/zap/event-zap-button";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";

export default function EmojiPackCard({ pack, ...props }: Omit<CardProps, "children"> & { pack: NostrEvent }) {
  const emojis = getEmojis(pack);
  const address = useShareableEventAddress(pack);

  // if there is a parent intersection observer, register this card
  const ref = useEventIntersectionRef(pack);

  return (
    <Card ref={ref} variant="outline" {...props}>
      <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={`/emojis/${address}`}>
            {getPackName(pack)}
          </HoverLinkOverlay>
        </Heading>
        <Text>by</Text>
        <UserAvatarLink pubkey={pack.pubkey} size="xs" />
        <UserLink pubkey={pack.pubkey} isTruncated fontWeight="bold" fontSize="md" />
      </CardHeader>
      <CardBody p="2">
        {emojis.length > 0 && (
          <Flex mb="2" wrap="wrap" gap="2">
            {emojis.map(({ shortcode, url }) => (
              <Image key={shortcode + url} src={url} title={shortcode} w={8} h={8} />
            ))}
          </Flex>
        )}
      </CardBody>
      <CardFooter p="2" display="flex" pt="0">
        <ButtonGroup size="sm" variant="ghost" zIndex={1}>
          <EventZapButton event={pack} />
          <EmojiPackFavoriteButton pack={pack} />
        </ButtonGroup>
        <ButtonGroup size="sm" ml="auto" variant="ghost" zIndex={1}>
          <EmojiPackMenu pack={pack} aria-label="emoji pack menu" />
        </ButtonGroup>
      </CardFooter>
    </Card>
  );
}
