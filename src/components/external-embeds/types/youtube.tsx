import { AspectRatio } from "@chakra-ui/react";
import appSettings from "../../../services/settings/app-settings";
import ExpandableEmbed from "../expandable-embed";

// copied from https://github.com/SimonBrazell/privacy-redirect/blob/master/src/assets/javascripts/helpers/youtube.js
export const YOUTUBE_DOMAINS = [
  "m.youtube.com",
  "youtube.com",
  "img.youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "s.ytimg.com",
  "music.youtube.com",
];

export function renderYoutubePlaylistURL(match: URL) {
  if (!YOUTUBE_DOMAINS.includes(match.hostname)) return null;
  if (!match.pathname.startsWith("/playlist")) return null;

  const { youtubeRedirect } = appSettings.value;

  const listId = match.searchParams.get("list");
  if (!listId) return null;

  const embedUrl = new URL(`embed/videoseries`, youtubeRedirect || "https://www.youtube-nocookie.com");
  embedUrl.searchParams.set("list", listId);

  return (
    <ExpandableEmbed label="Youtube Playlist" url={match}>
      <AspectRatio ratio={560 / 315} maxWidth="40rem" zIndex={1} position="relative">
        <iframe
          src={embedUrl.toString()}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          width="100%"
        ></iframe>
      </AspectRatio>
    </ExpandableEmbed>
  );
}

export function renderYoutubeVideoURL(match: URL) {
  if (!YOUTUBE_DOMAINS.includes(match.hostname)) return null;
  if (match.pathname.startsWith("/live")) return null;

  const { youtubeRedirect } = appSettings.value;

  var videoId = match.searchParams.get("v");
  if (match.hostname === "youtu.be") videoId = match.pathname.split("/")[1];
  if (!videoId) return null;

  const embedUrl = new URL(`/embed/${videoId}`, youtubeRedirect || "https://www.youtube-nocookie.com");

  return (
    <ExpandableEmbed label="Youtube" url={match}>
      <AspectRatio ratio={16 / 10} maxWidth="40rem" zIndex={1} position="relative">
        <iframe
          src={embedUrl.toString()}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          width="100%"
        ></iframe>
      </AspectRatio>
    </ExpandableEmbed>
  );
}

// nostr:nevent1qqszwj6mk665ga4r25w5vzxmy9rsvqj42kk4gnkq2t2utljr6as948qpp4mhxue69uhkummn9ekx7mqprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk245xvyn
export function renderYoutubeURL(match: URL) {
  if (!YOUTUBE_DOMAINS.includes(match.hostname)) return null;
  if (match.pathname.startsWith("/live")) return null;

  const { youtubeRedirect } = appSettings.value;

  return renderYoutubePlaylistURL(match) || renderYoutubeVideoURL(match);
}
