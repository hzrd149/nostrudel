import { useState } from "react";
import { Box, BoxProps, Button } from "@chakra-ui/react";
import { useRenderedContent } from "applesauce-react/hooks";

import { NostrEvent } from "../../../types/nostr-event";
import { getCommunityDescription } from "../../../helpers/nostr/communities";
import { components } from "../../../components/content";
import { renderGenericUrl } from "../../../components/content/links";

const linkRenderers = [renderGenericUrl];

export default function CommunityDescription({
  community,
  maxLength,
  showExpand,
  ...props
}: Omit<BoxProps, "children"> & { community: NostrEvent; maxLength?: number; showExpand?: boolean }) {
  const description = getCommunityDescription(community);
  const [showAll, setShowAll] = useState(false);
  const content = useRenderedContent(description, components, {
    maxLength: showAll ? undefined : maxLength,
    linkRenderers,
  });

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
