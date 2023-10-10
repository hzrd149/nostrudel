import { lazy } from "react";
import { EmbedableContent, embedJSX } from "../../helpers/embeds";
import { getMatchCashu } from "../../helpers/regexp";

const InlineCachuCard = lazy(() => import("../inline-cashu-card"));

export function embedCashuTokens(content: EmbedableContent) {
  return embedJSX(content, {
    regexp: getMatchCashu(),
    render: (match) => {
      return <InlineCachuCard token={match[0]} />;
    },
    name: "emoji",
  });
}
