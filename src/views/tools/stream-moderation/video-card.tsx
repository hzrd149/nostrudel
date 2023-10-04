import { memo } from "react";

import { LiveVideoPlayer } from "../../../components/live-video-player";
import { ParsedStream } from "../../../helpers/nostr/stream";

function LiveVideoCard({ stream }: { stream: ParsedStream }) {
  return (
    <LiveVideoPlayer
      stream={stream.recording || stream.streaming}
      autoPlay={stream.status === "live" ? true : undefined}
      poster={stream.image}
      muted
    />
  );
}

export default memo(LiveVideoCard);
