import { Box, BoxProps } from "@chakra-ui/react";
import { useRenderedContent } from "applesauce-react/hooks";

import { ParsedStream } from "../../../helpers/nostr/stream";
import { renderGenericUrl, renderImageUrl } from "../../../components/content/links";
import { components } from "../../../components/content";

const linkRenderers = [renderImageUrl, renderGenericUrl];

export default function StreamSummaryContent({ stream, ...props }: BoxProps & { stream: ParsedStream }) {
  const content = useRenderedContent(stream.event, components, { linkRenderers });

  return (
    content && (
      <Box whiteSpace="pre-wrap" {...props}>
        {content}
      </Box>
    )
  );
}
