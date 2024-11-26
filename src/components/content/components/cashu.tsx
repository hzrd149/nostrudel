import { CashuToken } from "applesauce-content/nast";

import InlineCachuCard from "../../cashu/inline-cashu-card";

export default function Cashu({ node }: { node: CashuToken }) {
  return <InlineCachuCard token={node.token} encoded={node.raw} />;
}
