import { useRef } from "react";
import { Card, CardProps, Flex, Image, LinkBox, LinkOverlay, Tag, Text } from "@chakra-ui/react";

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
import { UserAvatarLink } from "../../user-avatar-link";
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
    <Card as={LinkBox} ref={ref} p="2" flexDirection="row" {...props}>
      <Flex gap="2" direction="column" flex={1}>
        <Flex gap="2" alignItems="center">
          <UserAvatarLink pubkey={article.pubkey} size="sm" />
          <LinkOverlay href={naddr ? buildAppSelectUrl(naddr, false) : undefined} isExternal fontWeight="bold">
            {title}
          </LinkOverlay>
          <Text>by:</Text>
          <UserLink pubkey={article.pubkey} />
          <Text>
            | <Timestamp timestamp={getArticlePublishDate(article) ?? article.created_at} />
          </Text>
        </Flex>
        <Text flex={1}>{summary}</Text>
        <Flex gap="2" alignItems="center">
          {article.tags
            .filter((t) => t[0] === "t")
            .map(([_, hashtag]) => (
              <Tag>{hashtag}</Tag>
            ))}
        </Flex>
      </Flex>
      {image && <Image src={image} alt={title} maxW="2in" maxH="2in" float="right" borderRadius="md" />}
    </Card>
  );
}
