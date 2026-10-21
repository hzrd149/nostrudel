import { use$ } from "applesauce-react/hooks";

import { socialGraph$, socialGraphVersion$ } from "../services/social-graph";

/**
 * Returns the social graph and a version that changes whenever the graph is mutated in place.
 * Include `version` in memo dependencies that read from the graph.
 */
export default function useSocialGraph() {
  const graph = use$(socialGraph$);
  const version = use$(socialGraphVersion$);
  return { graph, version };
}
