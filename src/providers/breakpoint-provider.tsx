import { PropsWithChildren, createContext, useContext } from "react";
import { UseBreakpointOptions, useBreakpoint as useBaseBreakpoint, useTheme } from "@chakra-ui/react";
import { isObject } from "@chakra-ui/shared-utils";
import { arrayToObjectNotation } from "@chakra-ui/breakpoint-utils";
import { breakpoints as defaultBreakPoints } from "@chakra-ui/breakpoint-utils";

// ChakraUIs useBreakpointValue renders twice, once with the fallback value then with the actual breakpoint value
// This causes a lot of re-renders and wasted processing.
// This provider is designed to solve that by providing the current breakpoint through context

const BreakpointContext = createContext("base");

export function useBreakpoint(arg?: string | UseBreakpointOptions) {
  return useContext(BreakpointContext) ?? (typeof arg === "object" ? arg.fallback : arg);
}

// copied from https://github.com/chakra-ui/chakra-ui/blob/main/packages/components/media-query/src/media-query.utils.ts
export function getClosestValue<T = any>(
  values: Record<string, T>,
  breakpoint: string,
  breakpoints = defaultBreakPoints,
) {
  let index = Object.keys(values).indexOf(breakpoint);

  if (index !== -1) {
    return values[breakpoint];
  }

  let stopIndex = breakpoints.indexOf(breakpoint);

  while (stopIndex >= 0) {
    const key = breakpoints[stopIndex];

    if (values.hasOwnProperty(key)) {
      index = stopIndex;
      break;
    }
    stopIndex -= 1;
  }

  if (index !== -1) {
    const key = breakpoints[index];
    return values[key];
  }

  return undefined;
}

// copied from https://github.com/chakra-ui/chakra-ui/blob/main/packages/components/media-query/src/use-breakpoint-value.ts
export function useBreakpointValue<T = any>(
  values: Partial<Record<string, T>> | Array<T | null>,
  arg?: UseBreakpointOptions | string,
): T | undefined {
  const opts = isObject(arg) ? arg : { fallback: arg ?? "base" };
  // NOTE: get the breakpoint from context instead of calling ChakraUIs useBreakpoint hook
  const breakpoint = useBreakpoint(opts);
  const theme = useTheme();

  if (!breakpoint) return;

  /**
   * Get the sorted breakpoint keys from the provided breakpoints
   */
  const breakpoints = Array.from(theme.__breakpoints?.keys || []);

  const obj = Array.isArray(values)
    ? Object.fromEntries<any>(
        Object.entries(arrayToObjectNotation(values, breakpoints)).map(([key, value]) => [key, value]),
      )
    : values;

  return getClosestValue(obj, breakpoint, breakpoints);
}

export default function BreakpointProvider({ children }: PropsWithChildren) {
  const breakpoint = useBaseBreakpoint();

  return <BreakpointContext.Provider value={breakpoint}>{children}</BreakpointContext.Provider>;
}
