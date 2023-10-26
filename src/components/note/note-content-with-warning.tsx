import { NostrEvent } from "../../types/nostr-event";

import { NoteContents } from "./note-contents";
import { useExpand } from "../../providers/expanded";
import SensitiveContentWarning from "../sensitive-content-warning";
import useAppSettings from "../../hooks/use-app-settings";

export default function NoteContentWithWarning({ event }: { event: NostrEvent }) {
  const expand = useExpand();
  const settings = useAppSettings();

  const contentWarningTag = event.tags.find((t) => t[0] === "content-warning");
  const showContentWarning = settings.showContentWarning && contentWarningTag && !expand?.expanded;

  return showContentWarning ? (
    <SensitiveContentWarning description={contentWarningTag?.[1]} />
  ) : (
    <NoteContents px="2" event={event} />
  );
}
