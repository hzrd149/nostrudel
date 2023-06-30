import React from "react";
import useSubject from "../hooks/use-subject";
import { TimelineLoader } from "../classes/timeline-loader";
import RepostNote from "./repost-note";
import { Note } from "./note";

const GenericNoteTimeline = React.memo(({ timeline }: { timeline: TimelineLoader }) => {
  const notes = useSubject(timeline.timeline);

  return (
    <>
      {notes.map((note) =>
        note.kind === 6 ? (
          <RepostNote key={note.id} event={note} maxHeight={1200} />
        ) : (
          <Note key={note.id} event={note} maxHeight={1200} />
        )
      )}
    </>
  );
});

export default GenericNoteTimeline;
