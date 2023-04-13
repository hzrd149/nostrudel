import { EmbedableContent, embedJSX } from "../../helpers/embeds";

// nostr:nevent1qqs9r94qeqhqayvuz6q6u88spvuz0d25nhpyv0c39wympmfu646x4pgpz3mhxue69uhhyetvv9ujuerpd46hxtnfduq3samnwvaz7tmjv4kxz7fwwdhx7un59eek7cmfv9kqmhxhvq
export function embedSpotifyMusic(content: EmbedableContent) {
  return embedJSX(content, {
    regexp:
      /https?:\/\/open\.spotify\.com\/(track|episode|album|playlist)\/(\w+)(\??(?:[\?#\-\+=&;%@\.\w_]*)#?(?:[\-\.\!\/\\\w]*))?/im,
    render: (match) => {
      const isList = match[1] === "album" || match[1] === "playlist";
      return (
        <iframe
          style={{ borderRadius: "12px" }}
          width="100%"
          height={isList ? 400 : 152}
          title="Spotify Embed: Beethoven - Fur Elise - Komuz Remix"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          src={`https://open.spotify.com/embed/${match[1]}/${match[2]}`}
        ></iframe>
      );
    },
    name: "Spotify",
  });
}
