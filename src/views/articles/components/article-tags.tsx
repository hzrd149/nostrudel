import { Box, BoxProps, Link } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

export default function ArticleTags({ article, ...props }: { article: NostrEvent } & Omit<BoxProps, "children">) {
  return (
    <Box as="ul" listStyleType="none" aria-label="Article tags" {...props}>
      {article.tags
        .filter((t) => t[0] === "t" && t[1])
        .map(([_, hashtag]: string[], i) => (
          <Link
            key={hashtag + i}
            color="blue.500"
            whiteSpace="pre"
            flexShrink={0}
            as="li"
            display="inline"
            listStyleType="none"
            mr="2"
          >
            #{hashtag}
          </Link>
        ))}
    </Box>
  );
}
