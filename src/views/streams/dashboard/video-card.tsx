import { memo } from "react";
import { NostrEvent } from "nostr-tools";
import { isStreamURL } from "applesauce-core/helpers";

import LiveVideoPlayer from "../../../components/live-video-player";
import { getStreamImage, getStreamRecording, getStreamStreamingURLs } from "../../../helpers/nostr/stream";

function LiveVideoCard({ stream }: { stream: NostrEvent }) {
  const videoStreams = getStreamStreamingURLs(stream).filter(isStreamURL);
  const recording = getStreamRecording(stream);
  const image = getStreamImage(stream);

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
