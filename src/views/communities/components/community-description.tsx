import { useState } from "react";
import { Box, BoxProps, Button } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { getCommunityDescription } from "../../../helpers/nostr/communities";
import { EmbedableContent, embedUrls, truncateEmbedableContent } from "../../../helpers/embeds";
import { renderGenericUrl } from "../../../components/embed-types";

export default function CommunityDescription({
  community,
  maxLength,
  showExpand,
  ...props
}: Omit<BoxProps, "children"> & { community: NostrEvent; maxLength?: number; showExpand?: boolean }) {
  const description = getCommunityDescription(community);
  let content: EmbedableContent = description ? [description] : [];
  const [showAll, setShowAll] = useState(false);

  content = embedUrls(content, [renderGenericUrl]);
  if (maxLength !== undefined && !showAll) {
    content = truncateEmbedableContent(content, maxLength);
  }

  return (
    <>
      <Box whiteSpace="pre-wrap" {...props}>
        {content}
      </Box>
      {maxLength !== undefined && showExpand && !showAll && (description?.length ?? 0) > maxLength && (
        <Button variant="link" onClick={() => setShowAll(true)}>
          Show More
        </Button>
      )}
    </>
  );
}
