import { Button, Image, Link } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

export default function TrackStemstrButton({ track }: { track: NostrEvent }) {
  return (
    <Button
      as={Link}
      leftIcon={<Image src="https://stemstr.app/favicon.svg" />}
      href={`https://stemstr.app/thread/${track.id}`}
      colorScheme="purple"
      isExternal
    >
      View on Stemstr
    </Button>
  );
}
