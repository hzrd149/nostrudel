import { AspectRatio } from "@chakra-ui/react";
import ExpandableEmbed from "../components/content-embed";

const THREESPEAK_DOMAINS = ["3speak.tv", "www.3speak.tv"];
// hive account name / permlink, e.g. "seckorama/sumski-vinodol"
const THREESPEAK_VIDEO_ID = /^[a-z][a-z0-9.-]{1,14}[a-z0-9]\/[a-z0-9-]+$/;

export function renderThreeSpeakUrl(match: URL) {
  if (!THREESPEAK_DOMAINS.includes(match.hostname)) return null;
  if (match.pathname !== "/watch" && match.pathname !== "/shorts") return null;

  const videoId = match.searchParams.get("v");
  if (!videoId || !THREESPEAK_VIDEO_ID.test(videoId)) return null;

  const isShort = match.pathname === "/shorts";

  return (
    <ExpandableEmbed label="3Speak" url={match}>
      <AspectRatio
        ratio={isShort ? 9 / 16 : 16 / 9}
        maxWidth={isShort ? "20rem" : "40rem"}
        zIndex={1}
        position="relative"
      >
        <iframe
          src={`https://play.3speak.tv/watch?v=${videoId}&mode=iframe`}
          title="3Speak video player"
          frameBorder="0"
          allow="encrypted-media; picture-in-picture; fullscreen"
          width="100%"
        ></iframe>
      </AspectRatio>
    </ExpandableEmbed>
  );
}
