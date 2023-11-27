import React from "react";
import { Box, BoxProps, Text } from "@chakra-ui/react";

import { DraftNostrEvent, NostrEvent } from "../types/nostr-event";
import { EmbedableContent, embedUrls, truncateEmbedableContent } from "../helpers/embeds";
import { embedNostrLinks, embedNostrMentions, embedNostrHashtags, embedEmoji, renderGenericUrl } from "./embed-types";
import { LightboxProvider } from "./lightbox-provider";

function buildContents(event: NostrEvent | DraftNostrEvent, textOnly = false) {
  let content: EmbedableContent = [event.content.trim().replace(/\n+/g, "\n")];

  // common
  content = embedUrls(content, [renderGenericUrl]);

  // nostr
  content = embedNostrLinks(content, textOnly);
  content = embedNostrMentions(content, event);
  content = embedNostrHashtags(content, event);
  content = embedEmoji(content, event);

  return content;
}

export type NoteContentsProps = {
  event: NostrEvent | DraftNostrEvent;
  textOnly?: boolean;
  maxLength?: number;
};

export const CompactNoteContent = React.memo(
  ({ event, maxLength, textOnly = false, ...props }: NoteContentsProps & Omit<BoxProps, "children">) => {
    let content = buildContents(event, textOnly);
    let truncated = maxLength !== undefined ? truncateEmbedableContent(content, maxLength) : content;

    return (
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {truncated}
          {truncated !== content ? (
            <>
              <span>...</span>
              <Text as="span" fontWeight="bold" ml="4">
                Show More
              </Text>
            </>
          ) : null}
        </Box>
      </LightboxProvider>
    );
  },
);
