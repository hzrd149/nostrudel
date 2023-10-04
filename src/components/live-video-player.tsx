import { HTMLProps, useCallback, useEffect, useRef, useState } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import Hls from "hls.js";
import ReactPlayer from "react-player";

export enum VideoStatus {
  Online = "online",
  Offline = "offline",
}

// copied from zap.stream
export function LiveVideoPlayer({
  stream,
  autoPlay,
  poster,
  muted,
  ...props
}: Omit<BoxProps, "children"> & {
  stream?: string;
  autoPlay?: boolean;
  poster?: string;
  muted?: HTMLProps<HTMLVideoElement>["muted"];
}) {
  const [status, setStatus] = useState<VideoStatus>(VideoStatus.Online);
  const [url, setUrl] = useState<string>();

  const load = useCallback((url?: string) => {
    setUrl(undefined);
    setUrl(url);
  }, []);

  useEffect(() => {
    load(stream);
  }, [load, stream]);
  return (
    <ReactPlayer
      url={url}
      controls={status !== VideoStatus.Offline}
      playing={autoPlay}
      config={{ file: { attributes: { poster } } }}
      muted={muted}
      width="100%"
      height="100%"
      style={{ aspectRatio: "16/9" }}
      onStart={() => {
        setStatus(VideoStatus.Online);
        load(stream);
      }}
      onError={(event, data) => {
        const errorType = data.type;
        if (errorType === Hls.ErrorTypes.NETWORK_ERROR && data.fatal) {
          setStatus(VideoStatus.Offline);
        }
      }}
    />
  );
}
