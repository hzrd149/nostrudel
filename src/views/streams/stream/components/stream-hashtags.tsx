import { Tag } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { getStreamHashtags } from "../../../../helpers/nostr/stream";

export default function StreamHashtags({ stream }: { stream: NostrEvent }) {
  return (
    <>
      {getStreamHashtags(stream).map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </>
  );
}
