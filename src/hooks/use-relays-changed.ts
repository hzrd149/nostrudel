import { useEffect, useRef } from "react";
import { usePrevious } from "react-use";

export default function useRelaysChanged(relays: string[], cb: (relays: string[]) => void) {
  const callback = useRef(cb);
  callback.current = cb;

  const prev = usePrevious(relays);
  useEffect(() => {
    if (!!prev && prev?.join(",") !== relays.join(",")) {
      // always call the latest callback
      callback.current(relays);
    }
  }, [relays.join(",")]);
}
