import { Button, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useEffect, useRef } from "react";

import { TimelineRange } from "../../helpers/timeline-range";
import { useScrollContainer } from "../../providers/local/scroll-container";

/** Start loading this far before the end of the rendered list scrolls into view */
const MARGIN = "1500px 0px";

/** The end of a timeline, reports when it nears the viewport so the range reaches further back */
export default function TimelineRangeEnd({ range }: { range: TimelineRange }) {
  const ref = useRef<HTMLDivElement>(null);
  const container = useScrollContainer();
  const { since } = use$(range.range$);

  useEffect(() => {
    if (!ref.current || !container) return;
    const observer = new IntersectionObserver(
      ([entry]) => range.view$.next({ ...range.view$.value, bottomNear: entry.isIntersecting }),
      { root: container, rootMargin: MARGIN },
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      range.view$.next({ ...range.view$.value, bottomNear: false });
    };
  }, [range, container]);

  return (
    <div ref={ref}>
      {since === 0 ? (
        <Text textAlign="center" color="GrayText" my="4">
          Beginning of history
        </Text>
      ) : (
        <Button onClick={range.loadMore} flexShrink={0} size="lg" mx="auto" display="flex" colorScheme="primary" my="4">
          Load More
        </Button>
      )}
    </div>
  );
}
