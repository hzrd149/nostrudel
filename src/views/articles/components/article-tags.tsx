import { Box, BoxProps, Link, Tag } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

export default function ArticleTags({ article, ...props }: { article: NostrEvent } & Omit<BoxProps, "children">) {
  return (
    <Box aria-label="Article tags" role="list" {...props}>
      {article.tags
        .filter((t) => t[0] === "t" && t[1])
        .map(([_, hashtag]: string[], i) => (
          <Link key={hashtag + i} color="blue.500" whiteSpace="pre" flexShrink={0} role="listitem" mr="2">
            #{hashtag}
          </Link>
        ))}
    </Box>
  );
}
