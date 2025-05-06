import { useMemo } from "react";
import { NostrEvent } from "nostr-tools";
import { Button, Flex, Heading, useDisclosure } from "@chakra-ui/react";

import EmbeddedArticle from "../../../components/embed-event/card/embedded-article";

const MAX_ARTICLES = 4;

export default function ArticleSearchResults({ articles }: { articles: NostrEvent[] }) {
  const more = useDisclosure();

  const filtered = useMemo(
    () => (more.isOpen ? articles : Array.from(articles).slice(0, MAX_ARTICLES)),
    [articles, more.isOpen],
  );

  return (
    <>
      <Flex justifyContent="space-between" gap="2" alignItems="flex-end">
        <Heading size="md">Articles ({articles.length})</Heading>
        {articles.length > MAX_ARTICLES && (
          <Button size="sm" variant="ghost" onClick={more.onToggle}>
            Show {more.isOpen ? "less" : "all"}
          </Button>
        )}
      </Flex>
      {filtered.map((article) => (
        <EmbeddedArticle key={article.id} article={article} />
      ))}
      {!more.isOpen && articles.length > MAX_ARTICLES && (
        <Button mx="auto" size="lg" variant="ghost" onClick={more.onOpen} px="10">
          Show all
        </Button>
      )}
    </>
  );
}
