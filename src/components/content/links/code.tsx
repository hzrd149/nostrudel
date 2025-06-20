import { Box } from "@chakra-ui/react";
import ExpandableEmbed from "../components/content-embed";

export function renderCodePenURL(match: URL) {
  if (match.hostname !== "codepen.io") return null;
  const id = match.pathname.match(/(pen\/debug|details|full|pen)\/([a-zA-Z]+)/)?.[2];
  if (!id) return null;

  return (
    <ExpandableEmbed label="CodePen" url={match}>
      <Box
        as="iframe"
        height="lg"
        w="full"
        scrolling="no"
        src={`https://codepen.io/necatikcl/embed/preview/${id}?default-tab=html%2Cresult`}
        frameBorder="no"
        loading="lazy"
        allowTransparency
        allowFullScreen
        zIndex={1}
      />
    </ExpandableEmbed>
  );
}

export function renderArchiveOrgURL(match: URL) {
  if (match.hostname !== "archive.org") return null;

  const id = match.pathname.match(/details\/([a-zA-Z0-9]+)/)?.[1];
  if (!id) return null;

  return (
    <ExpandableEmbed label="Archive.org" url={match}>
      <Box
        as="iframe"
        h="lg"
        w="full"
        maxW="lg"
        scrolling="no"
        src={`https://archive.org/embed/${id}`}
        frameBorder="no"
        loading="lazy"
        allowTransparency
        allowFullScreen
        zIndex={1}
      />
    </ExpandableEmbed>
  );
}
