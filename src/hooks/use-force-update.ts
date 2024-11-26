import { useCallback, useState } from "react";

export default function useForceUpdate() {
  const [count, setCount] = useState(0);
  const update = useCallback(() => {
    setCount((v) => v + 1);
  }, [setCount]);
  return update;
}
