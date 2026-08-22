import { Box, BoxProps, Text } from "@chakra-ui/react";
import { getTagValue } from "applesauce-core/helpers";
import { useRenderedContent } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { memo } from "react";

import { onlyLinkComponents } from "../../../components/content";

const PreviewContentSymbol = Symbol.for("event-preview-text");

/**
 * Renders an event's title if it has one, or a single-line content preview.
 * Nostr mentions (npub / nprofile) are rendered as @names instead of raw bech32 ids
 */
function EventPreviewText({ event, ...props }: { event: NostrEvent } & BoxProps) {
  const title = getTagValue(event, "title");
  const content = useRenderedContent(event, onlyLinkComponents, { cacheKey: PreviewContentSymbol });

  if (title) {
    return (
      <Text isTruncated {...props}>
        {title}
      </Text>
    );
  }

  return (
    <Box isTruncated {...props}>
      {content}
    </Box>
  );
}

export default memo(EventPreviewText);
