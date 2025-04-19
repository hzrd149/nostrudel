import { Button, ButtonGroup, Spinner } from "@chakra-ui/react";
import { isETag } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { Suspense, useMemo, useState } from "react";

import DiffViewer from "../../../components/diff/diff-viewer";
import TimelineItem from "../../../components/timeline-page/generic-note-timeline/timeline-item";
import useSingleEvent from "../../../hooks/use-single-event";

export default function CorrectionCard({
  correction,
  initView,
}: {
  correction: NostrEvent;
  initView?: "original" | "modified" | "diff";
}) {
  const originalId = correction.tags.find(isETag)?.[1];
  const original = useSingleEvent(originalId);

  // NOTE: produces an invalid event
  const modified = useMemo(() => original && { ...original, content: correction.content }, [correction, original]);

  const [show, setShow] = useState(initView || "modified");
  const showEvent = show === "original" ? original : modified;

  return (
    <div>
      <ButtonGroup isAttached ml="auto" size="xs">
        <Button onClick={() => setShow("original")} variant={show === "original" ? "solid" : "outline"}>
          Original
        </Button>
        <Button onClick={() => setShow("modified")} variant={show === "modified" ? "solid" : "outline"}>
          Modified
        </Button>
        <Button onClick={() => setShow("diff")} variant={show === "diff" ? "solid" : "outline"}>
          Diff
        </Button>
      </ButtonGroup>

      {show === "diff" ? (
        <Suspense fallback={<Spinner />}>
          <DiffViewer oldValue={original?.content || ""} newValue={correction.content} />
        </Suspense>
      ) : (
        showEvent && <TimelineItem event={showEvent} visible />
      )}
    </div>
  );
}
