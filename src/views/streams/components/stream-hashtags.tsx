import { Tag } from "@chakra-ui/react";
import { ParsedStream } from "../../../helpers/nostr/stream";

export default function StreamHashtags({ stream }: { stream: ParsedStream }) {
  return (
    <>
      {stream.tags.map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </>
  );
}
