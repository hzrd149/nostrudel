import { Box, BoxProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useRenderedContent } from "applesauce-react/hooks";
import { emojis, nostrMentions, links, hashtags } from "applesauce-content/text";

import { components } from "../content";
import { renderGenericUrl } from "../content/links";
import { nipDefinitions } from "../content/transform/nip-notation";
import { bipDefinitions } from "../content/transform/bip-notation";

const transformers = [links, nostrMentions, emojis, hashtags, nipDefinitions, bipDefinitions];

const linkRenderers = [renderGenericUrl];

const PicturePostContentSymbol = Symbol.for("picture-post-content");

export default function PicturePostContents({ post, ...props }: { post: NostrEvent } & Omit<BoxProps, "children">) {
  const content = useRenderedContent(post, components, {
    linkRenderers,
    transformers,
    cacheKey: PicturePostContentSymbol,
  });

  return (
    <Box whiteSpace="pre-wrap" dir="auto" {...props}>
      {content}
    </Box>
  );
}
