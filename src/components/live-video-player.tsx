import { Badge, Flex, FlexProps } from "@chakra-ui/react";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

export enum VideoStatus {
  Online = "online",
  Offline = "offline",
}

// copied from zap.stream
export function LiveVideoPlayer({
  stream,
  autoPlay,
  poster,
  ...props
}: FlexProps & { stream?: string; autoPlay?: boolean; poster?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<VideoStatus>();

  useEffect(() => {
    if (stream && video.current && !video.current.src && Hls.isSupported()) {
      try {
        const hls = new Hls();
        hls.loadSource(stream);
        hls.attachMedia(video.current);
        hls.on(Hls.Events.ERROR, (event, data) => {
          const errorType = data.type;
          if (errorType === Hls.ErrorTypes.NETWORK_ERROR && data.fatal) {
            hls.stopLoad();
            hls.detachMedia();
            setStatus(VideoStatus.Offline);
          }
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus(VideoStatus.Online);
        });
        return () => hls.destroy();
      } catch (e) {
        console.error(e);
        setStatus(VideoStatus.Offline);
      }
    }
  }, [video, stream]);

  return (
    <Flex justifyContent="center" alignItems="center" {...props} position="relative">
      <video
        ref={video}
        playsInline={true}
        controls={status === VideoStatus.Online}
        autoPlay={autoPlay}
        poster={poster}
        style={{ maxHeight: "100%", maxWidth: "100%", width: "100%" }}
      />
    </Flex>
  );
}
