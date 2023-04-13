import { cloneElement } from "react";

export type EmbedableContent = (string | JSX.Element)[];
export type EmbedType = {
  regexp: RegExp;
  render: (match: RegExpMatchArray) => JSX.Element | string;
  name: string;
};

export function embedJSX(content: EmbedableContent, embed: EmbedType): EmbedableContent {
  return content
    .map((subContent, i) => {
      if (typeof subContent === "string") {
        const match = subContent.match(embed.regexp);

        if (match && match.index !== undefined) {
          const before = subContent.slice(0, match.index);
          const after = subContent.slice(match.index + match[0].length, subContent.length);
          let embedRender = embed.render(match);

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
