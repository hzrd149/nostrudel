import { memo } from "react";
import { Box } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import EmbeddedArticle from "../../embed-event/event-types/embedded-article";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";

function ArticleNote({ article }: { article: NostrEvent }) {
  const ref = useEventIntersectionRef(article);

  return (
    <Box ref={ref}>
      <EmbeddedArticle article={article} />
    </Box>
  );
}

export default memo(ArticleNote);
