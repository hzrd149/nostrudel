import { CSSProperties, MouseEventHandler, ReactEventHandler, useCallback } from "react";
import { useContentSettings } from "../providers/local/content-settings";

export default function useMediaBlur(): {
  style: CSSProperties;
  onClick: MouseEventHandler;
  handleEvent: ReactEventHandler<HTMLElement>;
} {
  const { blurMedia, setOverride } = useContentSettings();

  const onClick = useCallback<MouseEventHandler>(
    (e) => {
      if (blurMedia) {
        e.stopPropagation();
        e.preventDefault();
        if (blurMedia) setOverride({ blurMedia: false });

        // prevent videos from auto playing
        if (e.target instanceof HTMLVideoElement) e.target.pause();
      }
    },
    [blurMedia, setOverride],
  );
  const handleEvent = useCallback<ReactEventHandler<HTMLElement>>(
    (e) => {
      if (blurMedia) {
        e.stopPropagation();
        e.preventDefault();
        if (blurMedia) setOverride({ blurMedia: false });

        // prevent videos from auto playing
        if (e.target instanceof HTMLVideoElement) e.target.pause();
      }
    },
    [blurMedia, setOverride],
  );

  const style: CSSProperties = blurMedia ? { filter: "blur(1.5rem)", cursor: "pointer" } : {};

  return { onClick, handleEvent, style };
}
