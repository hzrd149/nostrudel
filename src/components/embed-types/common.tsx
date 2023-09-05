import { Link } from "@chakra-ui/react";

import OpenGraphCard from "../open-graph-card";
import { isVideoURL } from "../../helpers/url";

export function renderVideoUrl(match: URL) {
  if (!isVideoURL(match)) return null;

  return <video src={match.toString()} controls style={{ maxWidth: "30rem", maxHeight: "20rem", width: "100%" }} />;
}

export function renderGenericUrl(match: URL) {
  return (
    <Link href={match.toString()} isExternal color="blue.500">
      {match.toString()}
    </Link>
  );
}

export function renderOpenGraphUrl(match: URL) {
  return <OpenGraphCard url={match} />;
}
