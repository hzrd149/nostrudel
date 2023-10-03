import { memo } from "react";

import { LiveVideoPlayer } from "../../../components/live-video-player";
import { ParsedStream } from "../../../helpers/nostr/stream";

function LiveVideoCard({ stream }: { stream: ParsedStream }) {
  return (
    <LiveVideoPlayer
      stream={stream.streaming || stream.recording}
      autoPlay={stream.streaming ? true : undefined}
      poster={stream.image}
      maxH="50vh"
      muted
    />
  );
}

export default memo(LiveVideoCard);
