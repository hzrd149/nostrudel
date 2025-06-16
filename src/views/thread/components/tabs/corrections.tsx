import { Flex } from "@chakra-ui/react";
import { ThreadItem } from "applesauce-core/models";
import { NostrEvent } from "nostr-tools";

import CorrectionCard from "../../../tools/corrections/correction-card";

export default function CorrectionsTab({ post, corrections }: { post: ThreadItem; corrections: NostrEvent[] }) {
  return (
    <Flex gap="2" direction="column">
      {corrections.map((correction) => (
        <CorrectionCard correction={correction} key={correction.id} initView="diff" />
      ))}
    </Flex>
  );
}
