import { Box, BoxProps } from "@chakra-ui/react";
import { useRenderedContent } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import { renderGenericUrl, renderImageUrl } from "../../../../components/content/links";
import { components } from "../../../../components/content";
import { getStreamSummary } from "../../../../helpers/nostr/stream";

const StreamSummaryContentSymbol = Symbol.for("stream-summary-content");
const linkRenderers = [renderImageUrl, renderGenericUrl];

export default function StreamSummaryContent({ stream, ...props }: BoxProps & { stream: NostrEvent }) {
  const content = useRenderedContent(stream, components, {
    linkRenderers,
    cacheKey: StreamSummaryContentSymbol,
    content: getStreamSummary(stream),
  });

  return (
    content && (
      <Box whiteSpace="pre-wrap" {...props}>
        {content}
      </Box>
    )
  );
}
