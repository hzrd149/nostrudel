import { memo } from "react";
import { NostrEvent } from "nostr-tools";
import { castEvent, Stream } from "applesauce-common/casts";
import { isStreamURL } from "applesauce-core/helpers";

import LiveVideoPlayer from "../../../components/live-video-player";
import { eventStore } from "../../../services/event-store";

function LiveVideoCard({ stream }: { stream: NostrEvent }) {
  const cast = castEvent(stream, Stream, eventStore);
  const videoStreams = cast.streamingURLs.filter(isStreamURL);
  const recording = cast.recording;
  const image = cast.image;

  return (
    <LiveVideoPlayer
      stream={videoStreams[0] || recording}
      autoPlay={videoStreams.length > 0}
      poster={image}
      maxH="50vh"
      muted
    />
  );
}

export default memo(LiveVideoCard);
