import { cloneElement } from "react";

export type EmbedableContent = (string | JSX.Element)[];
export type EmbedType = {
  regexp: RegExp;
  render: (match: RegExpMatchArray) => JSX.Element | string | null;
  name: string;
  getLocation?: (match: RegExpMatchArray) => { start: number; end: number };
};

function defaultGetLocation(match: RegExpMatchArray) {
  if (match.index === undefined) throw new Error("match dose not have index");
  return {
    start: match.index,
    end: match.index + match[0].length,
  };
}

export function embedJSX(content: EmbedableContent, embed: EmbedType): EmbedableContent {
  return content
    .map((subContent, i) => {
      if (typeof subContent === "string") {
        const match = subContent.match(embed.regexp);

        if (match && match.index !== undefined) {
          const { start, end } = (embed.getLocation || defaultGetLocation)(match);
          const before = subContent.slice(0, start);
          const after = subContent.slice(end, subContent.length);
          let embedRender = embed.render(match);

          if (embedRender === null) return subContent;

          if (typeof embedRender !== "string" && !embedRender.props.key) {
            embedRender = cloneElement(embedRender, { key: embed.name + i });
          }

          return [...embedJSX([before], embed), embedRender, ...embedJSX([after], embed)];
        }
      }

      return subContent;
    })
    .flat();
}

export type LinkEmbedHandler = (link: URL) => JSX.Element | string | null;

export function embedUrls(content: EmbedableContent, handlers: LinkEmbedHandler[]) {
  return embedJSX(content, {
    name: "embedUrls",
    regexp: /https?:\/\/([\dA-z\.-]+\.[A-z\.]{2,12})(\/[\+~%\/\.\w\-_]*)?([\?#][^\s]+)?/i,
    render: (match) => {
      try {
        const url = new URL(match[0]);
        for (const handler of handlers) {
          try {
            const content = handler(url);
            if (content) return content;
          } catch (e) {}
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
