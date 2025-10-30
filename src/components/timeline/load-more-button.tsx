import { Button } from "@chakra-ui/react";
import { TimelineLoader } from "applesauce-loaders/loaders";

export default function LoadMoreButton({ loader }: { loader?: TimelineLoader }) {
  if (!loader) return null;

  return (
    <Button onClick={() => loader()} flexShrink={0} size="lg" mx="auto" colorScheme="primary" my="4">
      Load More
    </Button>
  );
}
