import { AspectRatio } from "@chakra-ui/react";
import { EmbedType, EmbedableContent, embedJSX } from "../../helpers/embeds";

// nostr:note1ya94hd44g3m2x4gagcydkg28qcp924dd238vq5k4chly84mqt2wqnwgu6d
// nostr:note1apu56y4h2ms5uwpzz209vychr309kllhq6wz46te84u9rus5x7kqj5f5n9
export function embedYoutubeVideo(content: EmbedableContent) {
  return embedJSX(content, {
    name: "Youtube Video",
    regexp:
      /https?:\/\/(?:(?:www|m)\.)?(?:youtube\.com|youtu\.be)(\/(?:[\w\-]+\?v=|embed\/|v\/|live\/|shorts\/)?)([\w\-]+)(\S+)?/,
    render: (match) => (
      <AspectRatio ratio={16 / 10} maxWidth="30rem">
        <iframe
          src={`https://www.youtube.com/embed/${match[2]}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          width="100%"
        ></iframe>
      </AspectRatio>
    ),
  });
}

// nostr:note12vqqte3gtd729gp65tgdk0a8yym5ynwqjuhk5s6l333yethlvlcsqptvmk
export function embedYoutubePlaylist(content: EmbedableContent) {
  return embedJSX(content, {
    name: "Youtube Playlist",
    regexp: /https?:\/\/(?:(?:www|m)\.)?(?:youtube\.com|youtu\.be)\/(?:playlist\?list=)([\w\-]+)(\S+)?/im,
    render: (match) => (
      <AspectRatio ratio={560 / 315} maxWidth="30rem">
        <iframe
          // width="560"
          // height="315"
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/videoseries?list=${match[1]}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </AspectRatio>
    ),
  });
}

export function embedYoutubeMusic(content: EmbedableContent) {
  return embedJSX(content, {
    regexp: /https?:\/\/music\.youtube\.com\/watch\?v=(\w+)(\??(?:[\?#\-\+=&;%@\.\w_]*)#?(?:[\-\.\!\/\\\w]*))?/,
    render: (match) => (
      <AspectRatio ratio={16 / 10} maxWidth="30rem">
        <iframe
          width="100%"
          src={`https://youtube.com/embed/${match[1]}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </AspectRatio>
    ),
    name: "Youtube Music",
  });
}
