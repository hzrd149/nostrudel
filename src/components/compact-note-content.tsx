import { Box, BoxProps, Text } from "@chakra-ui/react";
import { Root, truncateContent } from "applesauce-content/nast";
import { EventTemplate, NostrEvent } from "nostr-tools";
import React, { useMemo, useRef } from "react";

import { emojis, hashtags, links, nostrMentions } from "applesauce-content/text";
import { useRenderedContent } from "applesauce-react/hooks";
import { components } from "./content";
import { renderGenericUrl } from "./content/links/common";
import { LightboxProvider } from "./lightbox-provider";

const linkRenderers = [renderGenericUrl];

const CompactNoteContentSymbol = Symbol.for("compact-note-content");

export type NoteContentsProps = {
  event: NostrEvent | EventTemplate;
  textOnly?: boolean;
  maxLength?: number;
};

export const CompactNoteContent = React.memo(
  ({ event, maxLength, textOnly = false, ...props }: NoteContentsProps & Omit<BoxProps, "children">) => {
    const truncated = useRef(false);
    const transformers = useMemo(
      () => [
        links,
        nostrMentions,
        emojis,
        hashtags,
        () => (tree: Root) => {
          const newTree = truncateContent(tree, maxLength);
          truncated.current = newTree !== tree;
        },
      ],
      [maxLength],
    );
    const content = useRenderedContent(event, components, {
      transformers,
      linkRenderers,
      maxLength,
      cacheKey: CompactNoteContentSymbol,
    });

    return (
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" role="article" aria-label="Note content" {...props}>
          {content}
          {truncated.current && (
            <>
              <span>...</span>
              <Text as="span" fontWeight="bold" ml="4" role="button" tabIndex={0} aria-label="Show more content">
                Show More
              </Text>
            </>
          )}
        </Box>
      </LightboxProvider>
    );
  },
);
