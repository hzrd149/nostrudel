import { Button } from "@chakra-ui/react";
import { TimelineLoader } from "applesauce-loaders/loaders";

import { loadMoreTimeline } from "../../helpers/load-timeline-window";

export default function LoadMoreButton({ loader }: { loader?: TimelineLoader }) {
  if (!loader) return null;

  return (
    <Button onClick={() => loadMoreTimeline(loader)} flexShrink={0} size="lg" mx="auto" colorScheme="primary" my="4">
      Load More
    </Button>
  );
}
