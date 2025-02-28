import { Link, Tooltip } from "@chakra-ui/react";
import { BIPToken } from "../transform/bip-notation";

export default function BipDefinition({ node }: { node: BIPToken }) {
  return (
    <Tooltip label={node.name} aria-label="BIP Definition">
      <Link isExternal href={`https://bips.xyz/${node.bip}`} textDecoration="underline">
        {node.value}
      </Link>
    </Tooltip>
  );
}
