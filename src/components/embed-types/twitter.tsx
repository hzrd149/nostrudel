import { EmbedableContent, embedJSX } from "../../helpers/embeds";
import { TweetEmbed } from "../tweet-embed";

export function embedTweet(content: EmbedableContent) {
  return embedJSX(content, {
    name: "Tweet",
    regexp:
      /https?:\/\/twitter\.com\/(?:\#!\/)?(\w+)\/status(es)?\/(\d+)(\??(?:[\?#\-\+=&;%@\.\w_]*)#?(?:[\-\.\!\/\\\w]*))?/im,
    render: (match) => <TweetEmbed href={match[0]} conversation={false} />,
  });
}
