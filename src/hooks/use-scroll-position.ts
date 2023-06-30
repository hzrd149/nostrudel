import { MutableRefObject, useState } from "react";
import { useInterval } from "react-use";

export default function useScrollPosition(ref: MutableRefObject<HTMLDivElement | null>, interval = 1000) {
  const [percent, setPercent] = useState(0);
  useInterval(() => {
    if (!ref.current) return;
    const scrollBottom = ref.current.scrollTop + ref.current.getClientRects()[0].height;

    if (ref.current.scrollHeight === 0) {
      return setPercent(1);
    }

    const scrollPosition = Math.min(scrollBottom / ref.current.scrollHeight, 1);
    setPercent(scrollPosition);
  }, interval);
  return percent;
}
