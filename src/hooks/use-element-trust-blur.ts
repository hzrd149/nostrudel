import { CSSProperties, MouseEventHandler, ReactEventHandler, useCallback } from "react";
import { useTrustContext } from "../providers/local/trust";

export default function useElementTrustBlur(): {
  style: CSSProperties;
  onClick: MouseEventHandler;
  handleEvent: ReactEventHandler<HTMLElement>;
} {
  const { trust, setOverride } = useTrustContext();

  const onClick = useCallback<MouseEventHandler>(
    (e) => {
      if (!trust) {
        e.stopPropagation();
        e.preventDefault();
        if (!trust) setOverride(true);

        // prevent videos from auto playing
        if (e.target instanceof HTMLVideoElement) e.target.pause();
      }
    },
    [trust],
  );
  const handleEvent = useCallback<ReactEventHandler<HTMLElement>>(
    (e) => {
      if (!trust) {
        e.stopPropagation();
        e.preventDefault();
        if (!trust) setOverride(true);

        // prevent videos from auto playing
        if (e.target instanceof HTMLVideoElement) e.target.pause();
      }
    },
    [trust],
  );

  const style: CSSProperties = !trust ? { filter: "blur(1.5rem)", cursor: "pointer" } : {};

  return { onClick, handleEvent, style };
}
