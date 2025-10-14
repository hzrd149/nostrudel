import { Link, Tooltip } from "@chakra-ui/react";
import { NIPToken } from "../transform/nip-notation";
import NipLink from "../../nip-link";

export default function NipDefinition({ node }: { node: NIPToken }) {
  return (
    <Tooltip label={node.name} aria-label="NIP Definition">
      <NipLink nip={node.nip}>{node.value}</NipLink>
    </Tooltip>
  );
}
