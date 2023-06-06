import { EmbedableContent, embedJSX } from "../../helpers/embeds";

export function embedWavlakeTrack(content: EmbedableContent) {
  return embedJSX(content, {
    name: "Wavlake Track",
    regexp: /https?:\/\/wavlake\.com\/track\/[\w-]+/i,
    render: (match) => (
      <iframe
        loading="lazy"
        frameBorder="0"
        src={match[0].replace("wavlake.com", "embed.wavlake.com")}
        style={{ width: "100%", aspectRatio: 576 / 356, maxWidth: 573 }}
      ></iframe>
    ),
  });
}

// note1tvqk2mu829yr6asf7w5dgpp8t0mlp2ax5t26ctfdx8m0ptkssamqsleeux
// note1ygx9tec3af92704d92jwrj3zs7cws2jl29yvrlxzqlcdlykhwssqpupa7t
export function embedAppleMusic(content: EmbedableContent) {
  return embedJSX(content, {
    regexp: /https?:\/\/music\.apple\.com(?:\/[\+~%\/\.\w\-_]*)?(\??(?:[\?#\-\+=&;%@\.\w_]*)#?(?:[\-\.\!\/\\\w]*))?/,
    render: (match) => (
      <iframe
        allow="encrypted-media *; fullscreen *; clipboard-write"
        frameBorder="0"
        height={match[0].includes("?i=") ? 175 : 450}
        style={{ width: "100%", maxWidth: "660px", overflow: "hidden", background: "transparent" }}
        // sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        src={match[0].replace("music.apple.com", "embed.music.apple.com")}
      ></iframe>
    ),
    name: "Apple Music",
  });
}

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

// note132m5xc3zhj7fap67vzwx5x3s8xqgz49k669htcn8kppr4m654tuq960tuu
export function embedTidalMusic(content: EmbedableContent) {
  return embedJSX(content, {
    regexp: /https?:\/\/tidal\.com(\/browse)?\/(track|album)\/(\d+)/im,
    render: (match) => (
      <iframe
        src={`https://embed.tidal.com/${match[2]}s/${match[3]}?disableAnalytics=true`}
        width="100%"
        height={match[2] === "album" ? 400 : 96}
      ></iframe>
    ),
    name: "Tidal",
  });
}
