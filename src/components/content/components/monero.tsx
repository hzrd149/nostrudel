import { MoneroAddressToken } from "../transform/monero-address";
import InlineMoneroCard from "../../monero/inline-monero-card";
import ExpandableEmbed from "./content-embed";

export default function MoneroAddress({ node }: { node: MoneroAddressToken }) {
  return (
    <ExpandableEmbed label="Monero Address" url={`monero:${node.address}`} hideOnDefaultOpen>
      <InlineMoneroCard address={node.address} zIndex={1} position="relative" />
    </ExpandableEmbed>
  );
}
