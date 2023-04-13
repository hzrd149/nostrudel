import { EmbedableContent, embedJSX } from "../../helpers/embeds";

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
