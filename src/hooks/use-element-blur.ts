import { CSSProperties, EventHandler, MouseEventHandler, ReactEventHandler, useCallback, useState } from "react";

export default function useElementBlur(initBlur = false): {
  style: CSSProperties;
  onClick: MouseEventHandler;
  handleEvent: ReactEventHandler<HTMLElement>;
} {
  const [blur, setBlur] = useState(initBlur);

  const onClick = useCallback<MouseEventHandler>(
    (e) => {
      if (blur) {
        e.stopPropagation();
        e.preventDefault();
        setBlur(false);
      }
    },
    [blur],
  );
  const handleEvent = useCallback<ReactEventHandler<HTMLElement>>(
    (e) => {
      if (blur) {
        e.stopPropagation();
        e.preventDefault();
        setBlur(false);
      }
    },
    [blur],
  );

  const style: CSSProperties = blur ? { filter: "blur(1.5rem)", cursor: "pointer" } : {};

  return { onClick, handleEvent, style };
}
