import { lazy } from "react";
import { EmbedableContent, embedJSX } from "../../../helpers/embeds";
import { getMatchCashu } from "../../../helpers/regexp";

const InlineCachuCard = lazy(() => import("../../cashu/inline-cashu-card"));

export function embedCashuTokens(content: EmbedableContent) {
  return embedJSX(content, {
    regexp: getMatchCashu(),
    render: (match) => {
      // set zIndex and position so link over does not cover card
      return <InlineCachuCard token={match[0]} zIndex={1} position="relative" />;
    },
    name: "emoji",
  });
}
