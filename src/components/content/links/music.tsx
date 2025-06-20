import { Box, useColorMode } from "@chakra-ui/react";
import { CSSProperties } from "react";
import { STEMSTR_RELAY } from "../../../helpers/nostr/stemstr";
import useAppSettings from "../../../hooks/use-user-app-settings";
import { EmbedEventPointerCard } from "../../embed-event/card";
import ExpandableEmbed from "../components/content-embed";

const setZIndex: CSSProperties = { zIndex: 1, position: "relative" };

// nostr:nevent1qqsve4ud5v8gjds2f2h7exlmjvhqayu4s520pge7frpwe22wezny0pcpp4mhxue69uhkummn9ekx7mqprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk2mxs3z0
export function renderWavlakeUrl(match: URL) {
  if (!match.pathname.startsWith("/track")) return null;

  const embedUrl = new URL(match);
  embedUrl.hostname = "embed.wavlake.com";

  return (
    <ExpandableEmbed label="Wavlake" url={match}>
      <iframe
        loading="lazy"
        frameBorder="0"
        title="Wavlake Embed"
        src={embedUrl.toString()}
        style={{ width: "100%", height: 400, maxWidth: 600, borderRadius: 25, ...setZIndex }}
      ></iframe>
    </ExpandableEmbed>
  );
}

// nostr:nevent1qqs9kqt9d7r4zjpawcyl82x5qsn4hals4wn294dv95knrahs4mggwasprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk2whhzvz
// nostr:nevent1qqszyrz4uug75j4086kj4f8peg3g0v8g9f04zjxplnpq0uxljtthggqprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk2aeexmq
export function renderAppleMusicUrl(match: URL) {
  if (match.hostname !== "music.apple.com") return null;

  const isList = match.searchParams.get("l") !== null;

  const embedUrl = new URL(match);
  embedUrl.hostname = "embed.music.apple.com";

  return (
    <ExpandableEmbed label="Apple Music" url={match}>
      <iframe
        allow="encrypted-media *; fullscreen *; clipboard-write"
        frameBorder="0"
        title={isList ? "Apple Music List Embed" : "Apple Music Embed"}
        height={isList ? 450 : 175}
        style={{ width: "100%", maxWidth: "660px", overflow: "hidden", background: "transparent", ...setZIndex }}
        src={embedUrl.toString()}
      ></iframe>
    </ExpandableEmbed>
  );
}

// nostr:nevent1qqs9r94qeqhqayvuz6q6u88spvuz0d25nhpyv0c39wympmfu646x4pgpz3mhxue69uhhyetvv9ujuerpd46hxtnfduq3samnwvaz7tmjv4kxz7fwwdhx7un59eek7cmfv9kqmhxhvq
// nostr:nevent1qqsx0lz7m72qzq499exwhnfszvgwea8tv38x9wkv32yhkmwwmhgs7jgprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk25m3sln
// nostr:nevent1qqsqxkmz49hydf8ppa9k6x6zrcq7m4evhhlye0j3lcnz8hrl2q6np4spz3mhxue69uhhyetvv9ujuerpd46hxtnfdult02qz
const spotifyPaths = ["/track", "/episode", "/album", "/playlist"];
export function renderSpotifyUrl(match: URL) {
  if (match.hostname !== "open.spotify.com") return null;
  if (!spotifyPaths.some((p) => match.pathname.startsWith(p))) return null;

  const isList = match.pathname.startsWith("/album") || match.pathname.startsWith("/playlist");

  const embedUrl = new URL(match);
  embedUrl.pathname = "/embed" + embedUrl.pathname;

  return (
    <ExpandableEmbed label="Spotify" url={match}>
      <iframe
        style={{ borderRadius: "12px", ...setZIndex }}
        width="100%"
        height={isList ? 400 : 152}
        title={isList ? "Spotify List Embed" : "Spotify Embed"}
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        src={embedUrl.toString()}
      ></iframe>
    </ExpandableEmbed>
  );
}

// nostr:nevent1qqsg4d6rvg3te0y7sa0xp8r2rgcrnqyp2jmddzm4ufnmqs36aa2247qprpmhxue69uhhyetvv9ujuumwdae8gtnnda3kjctvmdc953
export function renderTidalUrl(match: URL) {
  if (match.hostname !== "tidal.com") return null;

  const isList = match.pathname.includes("/album");
  const [_, _browse, type, id] = match.pathname.match(/(\/browse)?\/(track|album)\/(\d+)/i) ?? [];

  const embedUrl = new URL(`https://embed.tidal.com/${type}s/${id}`);
  embedUrl.searchParams.set("disableAnalytics", "true");

  return (
    <ExpandableEmbed label="Tidal" url={match}>
      <iframe
        src={embedUrl.toString()}
        width="100%"
        height={isList ? 400 : 96}
        title={isList ? "Tidal List Embed" : "Tidal Embed"}
        allow="encrypted-media *;"
        style={setZIndex}
      ></iframe>
    </ExpandableEmbed>
  );
}

// nostr:nevent1qqsranya3ywngfvzz7kpfuz48kss3as5f5p76tcke38awwkfzqr27jqpr9mhxue69uhkummnw3ezuargv4ekzmt9vdshgtnfduhnes8e
export function renderSongDotLinkUrl(match: URL) {
  if (match.hostname !== "song.link" || match.pathname.length < 5) return null;
  const { colorMode } = useColorMode();

  return (
    <ExpandableEmbed url={match} label="Song.link">
      <Box
        as="iframe"
        w="full"
        h="full"
        maxW="xl"
        aspectRatio={16 / 10}
        src={`https://odesli.co/embed/?url=${encodeURIComponent(match.href)}&theme=${colorMode}`}
        sandbox="allow-same-origin allow-scripts allow-presentation allow-popups allow-popups-to-escape-sandbox"
        style={setZIndex}
      ></Box>
    </ExpandableEmbed>
  );
}

// nostr:nevent1qqs95384ynfcgugz29u25ltl7qs6d5chve8ksw7ms3ega8eyem3n5agpz9mhxue69uhkummnw3e82efwvdhk6qgnwaehxw309aex2mrp09skymr99ehhyec6lyxqd
export function renderStemstrUrl(match: URL) {
  if (match.hostname !== "stemstr.app") return null;

  const [_, base, id] = match.pathname.split("/");
  if (base !== "thread" || id.length !== 64) return null;

  return <EmbedEventPointerCard pointer={{ type: "nevent", data: { id, relays: [STEMSTR_RELAY] } }} />;
}

function SoundCloudEmbed({ match }: { match: URL }) {
  const { primaryColor } = useAppSettings();

  return (
    <iframe
      width="100%"
      height="166"
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
        match.protocol + match.host + match.pathname,
      )}&color=${encodeURIComponent(
        "#" + primaryColor || "ff5500",
      )}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
      style={setZIndex}
    ></iframe>
  );
}
export function renderSoundCloudUrl(match: URL) {
  if (match.hostname !== "soundcloud.com" || match.pathname.split("/").length !== 3) return null;

  return <SoundCloudEmbed match={match} />;
}
