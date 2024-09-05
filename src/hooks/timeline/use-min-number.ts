import { useEffect, useRef } from "react";

export default function useMinNumber(reset?: any, ...values: (number | undefined)[]) {
  const min = useRef<number>(Infinity);

  // reset min when reset changes
  useEffect(() => {
    min.current = Infinity;
  }, [reset]);

  for (const v of values) {
    if (v !== undefined) {
      if (min.current === undefined) min.current = v;
      else if (v < min.current) min.current = v;
    }
  }

  return min.current;
}
