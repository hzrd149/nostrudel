import { type CashuToken } from "applesauce-content/text/cashu";

import InlineCachuCard from "../../cashu/inline-cashu-card";

export default function Cashu({ node }: { node: CashuToken }) {
  return <InlineCachuCard token={node.token} encoded={node.raw} />;
}
