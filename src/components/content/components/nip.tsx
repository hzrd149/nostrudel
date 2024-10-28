import { Link, Tooltip } from "@chakra-ui/react";
import { NIPToken } from "../transform/nip-notation";

export default function NipDefinition({ node }: { node: NIPToken }) {
  return (
    <Tooltip label={node.name} aria-label="NIP Definition">
      <Link
        isExternal
        href={`https://github.com/nostr-protocol/nips/blob/master/${node.nip}.md`}
        textDecoration="underline"
      >
        {node.value}
      </Link>
    </Tooltip>
  );
}
