// nostr:nevent1qqsve4ud5v8gjds2f2h7exlmjvhqayu4s520pge7frpwe22wezny0pcpp4mhxue69uhkummn9ekx7mqprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk2mxs3z0
export function renderWavlakeUrl(match: URL) {
  if (match.hostname !== "wavlake.com") return null;

  const embedUrl = new URL(match);
  embedUrl.hostname = "embed.wavlake.com";

  return (
    <iframe
      loading="lazy"
      frameBorder="0"
      title="Wavlake Embed"
      src={embedUrl.toString()}
      style={{ width: "100%", aspectRatio: 576 / 356, maxWidth: 573 }}
    ></iframe>
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
    <iframe
      allow="encrypted-media *; fullscreen *; clipboard-write"
      frameBorder="0"
      title={isList ? "Apple Music List Embed" : "Apple Music Embed"}
      height={isList ? 450 : 175}
      style={{ width: "100%", maxWidth: "660px", overflow: "hidden", background: "transparent" }}
      src={embedUrl.toString()}
    ></iframe>
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
    <iframe
      style={{ borderRadius: "12px" }}
      width="100%"
      height={isList ? 400 : 152}
      title={isList ? "Spotify List Embed" : "Spotify Embed"}
      frameBorder="0"
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      src={embedUrl.toString()}
    ></iframe>
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
    <iframe
      src={embedUrl.toString()}
      width="100%"
      height={isList ? 400 : 96}
      title={isList ? "Tidal List Embed" : "Tidal Embed"}
    ></iframe>
  );
}
