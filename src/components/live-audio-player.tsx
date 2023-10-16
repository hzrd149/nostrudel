import { HTMLProps, useEffect, useRef } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import Hls from "hls.js";

export function LiveAudioPlayer({
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
  const audio = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (stream && audio.current && !audio.current.src && Hls.isSupported()) {
      try {
        const hls = new Hls({ capLevelToPlayerSize: true });
        hls.loadSource(stream);
        hls.attachMedia(audio.current);
        hls.on(Hls.Events.ERROR, (event, data) => {
          const errorType = data.type;
          if (errorType === Hls.ErrorTypes.NETWORK_ERROR && data.fatal) {
            hls.stopLoad();
            hls.detachMedia();
          }
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {});
        return () => hls.destroy();
      } catch (e) {
        console.error(e);
      }
    }
  }, [audio, stream]);

  return (
    <Box
      as="audio"
      ref={audio}
      playsInline={true}
      autoPlay={autoPlay}
      poster={poster}
      muted={muted}
      controls
      {...props}
    />
  );
}
