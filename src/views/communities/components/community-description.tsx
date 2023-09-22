import { Box, BoxProps } from "@chakra-ui/react";
import { NostrEvent } from "../../../types/nostr-event";
import { getCommunityDescription } from "../../../helpers/nostr/communities";
import { EmbedableContent, embedUrls, truncateEmbedableContent } from "../../../helpers/embeds";
import { renderGenericUrl } from "../../../components/embed-types";

export default function CommunityDescription({
  community,
  maxLength,
  ...props
}: Omit<BoxProps, "children"> & { community: NostrEvent; maxLength?: number }) {
  const description = getCommunityDescription(community);
  let content: EmbedableContent = description ? [description] : [];

  content = embedUrls(content, [renderGenericUrl]);
  if (maxLength !== undefined) {
    content = truncateEmbedableContent(content, maxLength);
  }

  return (
    <Box whiteSpace="pre-wrap" {...props}>
      {content}
    </Box>
  );
}
