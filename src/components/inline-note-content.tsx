import React from "react";
import { Box, BoxProps } from "@chakra-ui/react";

import { DraftNostrEvent, NostrEvent } from "../types/nostr-event";
import { EmbedableContent, embedUrls, truncateEmbedableContent } from "../helpers/embeds";
import { embedNostrLinks, embedNostrMentions, embedNostrHashtags, embedEmoji, renderGenericUrl } from "./embed-types";
import { LightboxProvider } from "./lightbox-provider";

function buildContents(event: NostrEvent | DraftNostrEvent) {
  let content: EmbedableContent = [event.content.trim().replace(/\n+/g, "\n")];

  // common
  content = embedUrls(content, [renderGenericUrl]);

  // nostr
  content = embedNostrLinks(content);
  content = embedNostrMentions(content, event);
  content = embedNostrHashtags(content, event);
  content = embedEmoji(content, event);

  return content;
}

export type NoteContentsProps = {
  event: NostrEvent | DraftNostrEvent;
  maxLength?: number;
};

export const InlineNoteContent = React.memo(
  ({ event, maxLength, ...props }: NoteContentsProps & Omit<BoxProps, "children">) => {
    let content = buildContents(event);
    let truncated = maxLength !== undefined ? truncateEmbedableContent(content, maxLength) : content;

    return (
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {truncated}
          {truncated !== content ? "..." : null}
        </Box>
      </LightboxProvider>
    );
  },
);
