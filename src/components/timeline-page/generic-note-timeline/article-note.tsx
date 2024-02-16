import { memo, useRef } from "react";
import { Box } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import EmbeddedArticle from "../../embed-event/event-types/embedded-article";
import { useRegisterIntersectionEntity } from "../../../providers/local/intersection-observer";
import { getEventUID } from "../../../helpers/nostr/event";

function ArticleNote({ article }: { article: NostrEvent }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(article));

  return (
    <Box ref={ref}>
      <EmbeddedArticle article={article} />
    </Box>
  );
}

export default memo(ArticleNote);
