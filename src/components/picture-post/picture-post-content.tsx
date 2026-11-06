import { Box, BoxProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useRenderedContent } from "applesauce-react/hooks";
import { blossomURIs, emojis, nostrMentions, links, hashtags } from "applesauce-content/text";

import MediaOwnerProvider from "../../providers/local/media-owner";
import { components } from "../content";
import { renderGenericUrl } from "../content/links";
import { nipDefinitions } from "../content/transform/nip-notation";
import { bipDefinitions } from "../content/transform/bip-notation";
import { moneroAddresses } from "../content/transform/monero-address";

const transformers = [
  blossomURIs,
  links,
  nostrMentions,
  emojis,
  hashtags,
  nipDefinitions,
  bipDefinitions,
  moneroAddresses,
];

const linkRenderers = [renderGenericUrl];

const PicturePostContentSymbol = Symbol.for("picture-post-content");

export default function PicturePostContents({ post, ...props }: { post: NostrEvent } & Omit<BoxProps, "children">) {
  const content = useRenderedContent(post, components, {
    linkRenderers,
    transformers,
    cacheKey: PicturePostContentSymbol,
  });

  return (
    <MediaOwnerProvider owner={post.pubkey}>
      <Box whiteSpace="pre-wrap" dir="auto" {...props}>
        {content}
      </Box>
    </MediaOwnerProvider>
  );
}
