import { EmbedableContent, embedJSX } from "../../../helpers/embeds";
import WikiLink from "../../../views/wiki/components/wiki-link";

export function embedNostrWikiLinks(content: EmbedableContent) {
  return embedJSX(content, {
    name: "embedWikiLinks",
    regexp: /\[\[(\w+)(?:\|(\w+))?\]\]/gi,
    render: (match, isEndOfLine) => {
      try {
        const topic = match[1];
        const label = match[2] || topic;

        if (topic) {
          return <WikiLink topic={topic}>{label}</WikiLink>;
        }
      } catch (e) {
        if (e instanceof Error) {
          console.error("Failed to embed link", match[0], e.message);
        }
      }
      return null;
    },
  });
}
