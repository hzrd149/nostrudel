import { Alert, AlertIcon, Button, Spinner } from "@chakra-ui/react";
import { TimelineLoader } from "applesauce-loaders";
import { useObservable } from "applesauce-react/hooks";

export default function TimelineActionAndStatus({ loader }: { loader?: TimelineLoader }) {
  const loading = useObservable(loader?.loading$);
  const complete = false;

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

  if (!loader) return null;

  return (
    <Button onClick={() => loader?.next(-Infinity)} flexShrink={0} size="lg" mx="auto" colorScheme="primary" my="4">
      Load More
    </Button>
  );
}
