import { memo } from "react";

import { DashboardCardProps } from "./common";
import { LiveVideoPlayer } from "../../../components/live-video-player";

function LiveVideoCard({ stream, children, ...props }: DashboardCardProps) {
  return (
    <LiveVideoPlayer stream={stream.streaming || stream.recording} autoPlay={false} poster={stream.image} maxH="50vh" />
  );
}

export default memo(LiveVideoCard);
