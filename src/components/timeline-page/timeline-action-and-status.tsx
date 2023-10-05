import { Alert, AlertIcon, Button, Spinner } from "@chakra-ui/react";

import TimelineLoader from "../../classes/timeline-loader";
import useSubject from "../../hooks/use-subject";

export default function TimelineActionAndStatus({ timeline }: { timeline: TimelineLoader }) {
  const loading = useSubject(timeline.loading);
  const complete = useSubject(timeline.complete);

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
    <Button onClick={() => timeline.loadMore()} flexShrink={0} size="lg" mx="auto" colorScheme="primary" my="4">
      Load More
    </Button>
  );
}
