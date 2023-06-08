import { AspectRatio } from "@chakra-ui/react";
import appSettings from "../../services/app-settings";

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

// nostr:nevent1qqszwj6mk665ga4r25w5vzxmy9rsvqj42kk4gnkq2t2utljr6as948qpp4mhxue69uhkummn9ekx7mqprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk245xvyn
export function renderYoutubeUrl(match: URL) {
  if (!YOUTUBE_DOMAINS.includes(match.hostname)) return null;
  if (match.pathname.startsWith("/live")) return null;

  const { youtubeRedirect } = appSettings.value;

  var videoId = match.searchParams.get("v");
  if (match.hostname === "youtu.be") videoId = match.pathname.split("/")[1];
  if (!videoId) throw new Error("cant find video id");
  const embedUrl = new URL(`/embed/${videoId}`, youtubeRedirect || "https://youtube.com");

  return (
    <AspectRatio ratio={16 / 10} maxWidth="40rem">
      <iframe
        src={embedUrl.toString()}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        width="100%"
      ></iframe>
    </AspectRatio>
  );
}
