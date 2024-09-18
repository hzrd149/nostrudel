import { Tag } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

export default function ArticleTags({ article }: { article: NostrEvent }) {
  return (
    <>
      {article.tags
        .filter((t) => t[0] === "t" && t[1])
        .map(([_, hashtag]: string[], i) => (
          <Tag key={hashtag + i} mr="2" mt="2" whiteSpace="pre" flexShrink={0}>
            #{hashtag}
          </Tag>
        ))}
    </>
  );
}
