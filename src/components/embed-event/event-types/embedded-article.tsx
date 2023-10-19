import { useRef } from "react";
import { Box, Card, CardBody, CardProps, Flex, Image, LinkBox, LinkOverlay, Tag, Text } from "@chakra-ui/react";

import {
  getArticleImage,
  getArticlePublishDate,
  getArticleSummary,
  getArticleTitle,
} from "../../../helpers/nostr/long-form";
import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { getEventUID } from "../../../helpers/nostr/events";
import { buildAppSelectUrl } from "../../../helpers/nostr/apps";
import { getSharableEventAddress } from "../../../helpers/nip19";
import UserAvatarLink from "../../user-avatar-link";
import { UserLink } from "../../user-link";
import Timestamp from "../../timestamp";

export default function EmbeddedArticle({ article, ...props }: Omit<CardProps, "children"> & { article: NostrEvent }) {
  const title = getArticleTitle(article);
  const image = getArticleImage(article);
  const summary = getArticleSummary(article);

  const naddr = getSharableEventAddress(article);

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(article));

  return (
    <Card as={LinkBox} ref={ref} size="sm" {...props}>
      {image && (
        <Box
          backgroundImage={image}
          w="full"
          aspectRatio={3 / 1}
          hideFrom="md"
          backgroundRepeat="no-repeat"
          backgroundPosition="center"
          backgroundSize="cover"
        />
      )}
      <CardBody>
        {image && (
          <Image src={image} alt={title} maxW="3in" maxH="2in" float="right" borderRadius="md" ml="2" hideBelow="md" />
        )}
        <Flex gap="2" alignItems="center" mb="2">
          <UserAvatarLink pubkey={article.pubkey} size="sm" />
          <UserLink pubkey={article.pubkey} fontWeight="bold" isTruncated />
          <Timestamp timestamp={getArticlePublishDate(article) ?? article.created_at} />
        </Flex>
        <LinkOverlay href={naddr ? buildAppSelectUrl(naddr, false) : undefined} isExternal fontWeight="bold">
          {title}
        </LinkOverlay>
        <Text mb="2">{summary}</Text>
        {article.tags
          .filter((t) => t[0] === "t")
          .map(([_, hashtag]) => (
            <Tag mr="2" mb="2">
              #{hashtag}
            </Tag>
          ))}
      </CardBody>
    </Card>
  );
}
