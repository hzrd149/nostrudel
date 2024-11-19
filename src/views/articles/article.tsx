import { NostrEvent } from "nostr-tools";
import { Box, Flex, Heading, Image, Spinner, Text } from "@chakra-ui/react";
import dayjs from "dayjs";

import useParamsAddressPointer from "../../hooks/use-params-address-pointer";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import {
  getArticleImage,
  getArticlePublishDate,
  getArticleSummary,
  getArticleTitle,
} from "../../helpers/nostr/long-form";
import UserLink from "../../components/user/user-link";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserDnsIdentityIcon from "../../components/user/user-dns-identity-icon";
import MarkdownContent from "../wiki/components/markdown";
import ArticleMenu from "./components/article-menu";
import ArticleTags from "./components/article-tags";
import NoteReactions from "../../components/note/timeline-note/components/note-reactions";
import NoteZapButton from "../../components/note/note-zap-button";
import ZapBubbles from "../../components/note/timeline-note/components/zap-bubbles";
import BookmarkEventButton from "../../components/note/bookmark-event";
import QuoteEventButton from "../../components/note/quote-event-button";

function ArticlePage({ article }: { article: NostrEvent }) {
  const image = getArticleImage(article);
  const title = getArticleTitle(article);
  const published = getArticlePublishDate(article);
  const summary = getArticleSummary(article);

  return (
    <VerticalPageLayout pt={{ base: "2", lg: "8" }} pb="12">
      <Box mx="auto" maxW="4xl" w="full" mb="2">
        <ArticleMenu article={article} aria-label="More Options" float="right" />
        <Heading size="xl">{title}</Heading>
        <Text>{summary}</Text>
        <Box py="2">
          <UserAvatarLink pubkey={article.pubkey} float="left" mr="3" mb="2" />
          <UserLink pubkey={article.pubkey} fontWeight="bold" fontSize="xl" mr="2" tab="articles" />
          <UserDnsIdentityIcon pubkey={article.pubkey} />
          <br />
          <Text>{dayjs.unix(published ?? article.created_at).format("LL")}</Text>
        </Box>
        <ArticleTags article={article} />
        <BookmarkEventButton event={article} aria-label="Bookmark" variant="ghost" float="right" size="sm" />
      </Box>
      {image && <Image src={image} maxW="6xl" w="full" mx="auto" maxH="60vh" />}
      <Box mx="auto" maxW="4xl" w="full">
        <ZapBubbles event={article} mb="2" />
        <Flex gap="2">
          <NoteZapButton event={article} size="sm" variant="ghost" showEventPreview={false} />
          <QuoteEventButton event={article} size="sm" variant="ghost" />
          <NoteReactions event={article} size="sm" variant="ghost" />
        </Flex>
        <Box fontSize="lg">
          <MarkdownContent event={article} />
        </Box>
        <Flex gap="2">
          <NoteZapButton event={article} size="sm" variant="ghost" showEventPreview={false} />
          <QuoteEventButton event={article} size="sm" variant="ghost" />
          <NoteReactions event={article} size="sm" variant="ghost" />
        </Flex>
      </Box>
    </VerticalPageLayout>
  );
}

export default function ArticleView() {
  const pointer = useParamsAddressPointer("naddr");

  const article = useReplaceableEvent(pointer);

  if (!article) return <Spinner />;

  return <ArticlePage article={article} />;
}
