import { useState } from "react";

export default function useMinNumber(reset?: unknown, ...values: (number | undefined)[]) {
  const [state, setState] = useState({ reset, min: Infinity });
  let min = state.reset === reset ? state.min : Infinity;

  for (const v of values) {
    if (v !== undefined) {
      if (v < min) min = v;
    }
  }

  if (state.reset !== reset || state.min !== min) setState({ reset, min });
  return min;
}
