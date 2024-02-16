import { NostrEvent } from "nostr-tools";

import { TextNoteContents } from "./text-note-contents";
import { useExpand } from "../../../providers/local/expanded";
import SensitiveContentWarning from "../../sensitive-content-warning";
import useAppSettings from "../../../hooks/use-app-settings";

export default function NoteContentWithWarning({ event }: { event: NostrEvent }) {
  const expand = useExpand();
  const settings = useAppSettings();

  const contentWarningTag = event.tags.find((t) => t[0] === "content-warning");
  const showContentWarning = settings.showContentWarning && contentWarningTag && !expand?.expanded;

  return showContentWarning ? (
    <SensitiveContentWarning description={contentWarningTag?.[1]} />
  ) : (
    <TextNoteContents px="2" event={event} />
  );
}
