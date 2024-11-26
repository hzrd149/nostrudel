import { cloneElement } from "react";
import { getMatchLink } from "./regexp";

/** @deprecated */
export type EmbedableContent = (string | JSX.Element)[];
/** @deprecated */
export type EmbedType = {
  regexp: RegExp;
  render: (match: RegExpMatchArray, isEndOfLine: boolean) => JSX.Element | string | null;
  name: string;
  getLocation?: (match: RegExpMatchArray) => { start: number; end: number };
};

export function defaultGetLocation(match: RegExpMatchArray) {
  if (match.index === undefined) throw new Error("match does not have index");
  return {
    start: match.index,
    end: match.index + match[0].length,
  };
}

/** @deprecated */
export function embedJSX(content: EmbedableContent, embed: EmbedType): EmbedableContent {
  return content
    .map((subContent, i) => {
      if (typeof subContent === "string") {
        const matches = subContent.matchAll(embed.regexp);

        if (matches) {
          const newContent: EmbedableContent = [];
          let cursor = 0;
          let str = subContent;
          for (const match of matches) {
            if (match.index !== undefined) {
              const { start, end } = (embed.getLocation || defaultGetLocation)(match);

              if (start < cursor) continue;

              const before = str.slice(0, start - cursor);
              const after = str.slice(end - cursor, str.length);
              const isEndOfLine = /^\p{Z}*(\n|$)/iu.test(after);
              let render = embed.render(match, isEndOfLine);
              if (render === null) continue;

              if (typeof render !== "string" && !render.props.key) {
                render = cloneElement(render, { key: embed.name + match[0] + match.index });
              }

              newContent.push(before, render);

              cursor = end;
              str = after;
            }
          }

          // if all matches failed just return the existing content
          if (newContent.length === 0) {
            return subContent;
          }

          // add the remaining string to the content
          if (str.length > 0) {
            newContent.push(str);
          }

          return newContent;
        }
      }

      return subContent;
    })
    .flat();
}

/** @deprecated */
export type LinkEmbedHandler = (link: URL, isEndOfLine: boolean) => JSX.Element | string | null;

/** @deprecated */
export function embedUrls(content: EmbedableContent, handlers: LinkEmbedHandler[]) {
  return embedJSX(content, {
    name: "embedUrls",
    regexp: getMatchLink(),
    render: (match, isEndOfLine) => {
      try {
        const url = new URL(match[0]);
        for (const handler of handlers) {
          try {
            const content = handler(url, isEndOfLine);
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

/** @deprecated */
export function truncateEmbedableContent(content: EmbedableContent, maxLength = 256) {
  let length = 0;
  for (let i = 0; i < content.length; i++) {
    const chunk = content[i];
    length += typeof chunk === "string" ? chunk.length : 8;

    if (length > maxLength) {
      if (typeof chunk === "string") {
        const newContent = i > 0 ? content.slice(0, i) : [];
        const chunkLength = chunk.length - (length - maxLength);

        // find the nearest newline
        const newLines = chunk.matchAll(/\n/g);
        for (const match of newLines) {
          if (match.index && match.index > chunkLength) {
            newContent.push(chunk.slice(0, match.index));
            return newContent;
          }
        }

        // just cut the string
        newContent.push(chunk.slice(0, maxLength - length));
        return newContent;
      } else return content.slice(0, i);
    }
  }
  return content;
}
