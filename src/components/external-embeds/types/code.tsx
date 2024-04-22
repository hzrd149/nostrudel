import { Box } from "@chakra-ui/react";
import ExpandableEmbed from "../expandable-embed";

export function renderCodePenURL(match: URL) {
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
      />
    </ExpandableEmbed>
  );
}
