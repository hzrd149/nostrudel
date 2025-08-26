import { Box, Card, CardProps, Flex, Heading, LinkBox, Spacer, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";

import HoverLinkOverlay from "../../../components/hover-link-overlay";
import ZapBubbles from "../../../components/note/timeline-note/components/zap-bubbles";
import Timestamp from "../../../components/timestamp";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import {
  getArticleImage,
  getArticlePublishDate,
  getArticleSummary,
  getArticleTitle,
} from "../../../helpers/nostr/long-form";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import ArticleMenu from "./article-menu";
import ArticleTags from "./article-tags";
import { getEventUID } from "applesauce-core/helpers";

const ArticleCard = memo(({ article, ...props }: { article: NostrEvent } & Omit<CardProps, "children">) => {
  const image = getArticleImage(article);
  const title = getArticleTitle(article);
  const published = getArticlePublishDate(article);
  const summary = getArticleSummary(article);

  const naddr = useShareableEventAddress(article);

  return (
    <Box
      as={LinkBox}
      position="relative"
      variant="ghost"
      overflow="hidden"
      role="article"
      aria-labelledby={getEventUID(article) + "-title"}
      {...props}
    >
      {image && (
        <Box
          aspectRatio={{ base: 3, lg: 16 / 9 }}
          backgroundImage={image}
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
          backgroundSize="cover"
          float={{ base: undefined, lg: "right" }}
          w={{ base: "full", lg: "initial" }}
          m={{ base: 0, lg: 2 }}
          minH="10rem"
          maxH="15rem"
        />
      )}
      <Box isTruncated p={2}>
        <Heading size="md" isTruncated id={getEventUID(article) + "-title"}>
          <HoverLinkOverlay as={RouterLink} to={`/articles/${naddr}`}>
            {title}
          </HoverLinkOverlay>
        </Heading>
        <Text fontStyle="italic">
          By: <UserName pubkey={article.pubkey} fontWeight="normal" /> Published:{" "}
          <Timestamp timestamp={published ?? article.created_at} />
        </Text>
      </Box>
      <Text noOfLines={4} px={2}>
        {summary}
      </Text>

      <Flex direction="column" gap={2} p={2}>
        <ArticleTags article={article} />
        <ZapBubbles event={article} />
      </Flex>
    </Box>
  );
});

ArticleCard.displayName = "ArticleCard";

export default ArticleCard;
