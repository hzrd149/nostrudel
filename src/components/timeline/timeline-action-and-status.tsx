import { Alert, AlertIcon, Button, Spinner } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import TimelineLoader from "../../classes/timeline-loader";

export default function TimelineActionAndStatus({ timeline }: { timeline: TimelineLoader }) {
  const loading = useObservable(timeline.loading);
  const complete = useObservable(timeline.complete);

  if (complete) {
    return (
      <Alert status="info" flexShrink={0}>
        <AlertIcon />
        No more events
      </Alert>
    );
  }

  if (loading) {
    return <Spinner ml="auto" mr="auto" mt="8" mb="8" flexShrink={0} />;
  }

  return (
    <Button
      onClick={() => timeline.loadAllNextChunks()}
      flexShrink={0}
      size="lg"
      mx="auto"
      colorScheme="primary"
      my="4"
    >
      Load More
    </Button>
  );
}
