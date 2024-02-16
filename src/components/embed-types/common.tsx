import { Link } from "@chakra-ui/react";

import OpenGraphCard from "../open-graph/open-graph-card";
import OpenGraphLink from "../open-graph/open-graph-link";

export function renderGenericUrl(match: URL) {
  return (
    <Link href={match.toString()} isExternal color="blue.500">
      {match.protocol +
        "//" +
        match.host +
        match.pathname +
        (match.search && match.search.length < 120 ? match.search : "") +
        (match.hash.length < 96 ? match.hash : "")}
    </Link>
  );
}

export function renderOpenGraphUrl(match: URL, isEndOfLine: boolean) {
  return isEndOfLine ? <OpenGraphCard url={match} /> : <OpenGraphLink url={match} />;
}
