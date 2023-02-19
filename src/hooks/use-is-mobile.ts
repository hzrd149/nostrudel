import { useEffect, useMemo, useState } from "react";

export function useIsMobile() {
  const match = useMemo(() => window.matchMedia("(max-width: 1000px)"), []);
  const [matches, setMatches] = useState(match.matches);

  useEffect(() => {
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    match.addEventListener("change", listener);
    return () => match.removeEventListener("change", listener);
  }, [match]);

  return matches;
}
