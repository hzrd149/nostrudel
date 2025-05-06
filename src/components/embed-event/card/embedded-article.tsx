import { Box, Card, CardBody, CardProps, Flex, Heading, Image, LinkBox, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import {
  getArticleImage,
  getArticlePublishDate,
  getArticleSummary,
  getArticleTitle,
} from "../../../helpers/nostr/long-form";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import ArticleTags from "../../../views/articles/components/article-tags";
import HoverLinkOverlay from "../../hover-link-overlay";
import Timestamp from "../../timestamp";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export default function EmbeddedArticle({ article, ...props }: Omit<CardProps, "children"> & { article: NostrEvent }) {
  const title = getArticleTitle(article);
  const image = getArticleImage(article);
  const summary = getArticleSummary(article);

  const naddr = useShareableEventAddress(article);

  return (
    <Card as={LinkBox} size="sm" {...props}>
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
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={`/articles/${naddr}`}>
            {title}
          </HoverLinkOverlay>
        </Heading>
        <Text mb="2">{summary}</Text>

        <ArticleTags article={article} />
      </CardBody>
    </Card>
  );
}
