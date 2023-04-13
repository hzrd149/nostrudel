import { EmbedableContent, embedJSX } from "../../helpers/embeds";

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
