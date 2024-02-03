import { useMemo } from "react";
import { ParsedStream } from "../../../helpers/nostr/stream";
import { EmbedableContent, embedUrls } from "../../../helpers/embeds";
import {
  embedEmoji,
  embedNipDefinitions,
  embedNostrHashtags,
  embedNostrLinks,
  embedNostrMentions,
  renderGenericUrl,
  renderImageUrl,
} from "../../../components/embed-types";
import { Box, BoxProps } from "@chakra-ui/react";

export default function StreamSummaryContent({ stream, ...props }: BoxProps & { stream: ParsedStream }) {
  const content = useMemo(() => {
    if (!stream.summary) return null;
    let c: EmbedableContent = [stream.summary];

    // general
    c = embedUrls(c, [renderImageUrl, renderGenericUrl]);

    // nostr
    c = embedNostrLinks(c);
    c = embedNostrMentions(c, stream.event);
    c = embedNostrHashtags(c, stream.event);
    c = embedNipDefinitions(c);
    c = embedEmoji(c, stream.event);

    return c;
  }, [stream.summary]);

  return (
    content && (
      <Box whiteSpace="pre-wrap" {...props}>
        {content}
      </Box>
    )
  );
}
