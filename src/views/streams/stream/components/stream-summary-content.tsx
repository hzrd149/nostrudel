import { Box, BoxProps } from "@chakra-ui/react";
import { Stream } from "applesauce-common/casts";
import { useRenderedContent } from "applesauce-react/hooks";

import { renderGenericUrl, renderImageUrl } from "../../../../components/content/links";
import { components } from "../../../../components/content";

const StreamSummaryContentSymbol = Symbol.for("stream-summary-content");
const linkRenderers = [renderImageUrl, renderGenericUrl];

export default function StreamSummaryContent({ stream, ...props }: BoxProps & { stream: Stream }) {
  const content = useRenderedContent(stream.event, components, {
    linkRenderers,
    cacheKey: StreamSummaryContentSymbol,
    content: stream.summary,
  });

  return (
    content && (
      <Box whiteSpace="pre-wrap" {...props}>
        {content}
      </Box>
    )
  );
}
