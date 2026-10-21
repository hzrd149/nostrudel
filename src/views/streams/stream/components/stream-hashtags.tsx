import { Tag } from "@chakra-ui/react";
import { Stream } from "applesauce-common/casts";

export default function StreamHashtags({ stream }: { stream: Stream }) {
  return (
    <>
      {stream.hashtags.map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </>
  );
}
