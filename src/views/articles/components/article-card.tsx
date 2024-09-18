import { Box, Card, Flex, Heading, LinkBox, Spacer, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import {
  getArticleImage,
  getArticlePublishDate,
  getArticleSummary,
  getArticleTitle,
} from "../../../helpers/nostr/long-form";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import Timestamp from "../../../components/timestamp";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import ArticleTags from "./article-tags";
import ArticleMenu from "./article-menu";
import ZapBubbles from "../../../components/note/timeline-note/components/zap-bubbles";

export default function ArticleCard({ article }: { article: NostrEvent }) {
  const image = getArticleImage(article);
  const title = getArticleTitle(article);
  const published = getArticlePublishDate(article);
  const summary = getArticleSummary(article);

  const naddr = useShareableEventAddress(article);

  return (
    <Card as={LinkBox} display="block" p="2" position="relative" variant="ghost">
      <Flex gap="2" alignItems="center" mb="2">
        <UserAvatar pubkey={article.pubkey} size="sm" />
        <UserName pubkey={article.pubkey} />
        <Timestamp timestamp={published ?? article.created_at} />
        <Spacer />
        <ArticleMenu aria-label="More Options" article={article} variant="ghost" size="sm" zIndex={10} />
      </Flex>

      {image && (
        <Box
          aspectRatio={16 / 9}
          backgroundImage={image}
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
          backgroundSize="cover"
          float={{ base: undefined, lg: "right" }}
          mx={{ base: "auto", lg: 2 }}
          mb={{ base: "2", lg: undefined }}
          minH="10rem"
          maxH="15rem"
        />
      )}
      <Heading size="md">
        <HoverLinkOverlay as={RouterLink} to={`/articles/${naddr}`}>
          {title}
        </HoverLinkOverlay>
      </Heading>
      <Text>{summary}</Text>

      <ArticleTags article={article} />

      <ZapBubbles event={article} mt="2" mr="2" />
    </Card>
  );
}
