import { Alert, AlertIcon, Button } from "@chakra-ui/react";
import { TimelineLoader } from "applesauce-loaders/loaders";

export default function TimelineActionAndStatus({ loader }: { loader?: TimelineLoader }) {
  // const loading = useObservableEagerMemo(() => loader?.loading$, [loader]);
  const complete = false;

  if (complete) {
    return (
      <Alert status="info" flexShrink={0}>
        <AlertIcon />
        No more events
      </Alert>
    );
  }

  // if (loading) {
  //   return <Spinner ml="auto" mr="auto" mt="8" mb="8" flexShrink={0} />;
  // }

  if (!loader) return null;

  return (
    <Button onClick={() => loader()} flexShrink={0} size="lg" mx="auto" colorScheme="primary" my="4">
      Load More
    </Button>
  );
}
