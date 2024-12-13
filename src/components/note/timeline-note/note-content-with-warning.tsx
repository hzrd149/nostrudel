import { NostrEvent } from "nostr-tools";
import { getContentWarning } from "applesauce-core/helpers";

import { TextNoteContents } from "./text-note-contents";
import { useExpand } from "../../../providers/local/expanded";
import ContentWarning from "../../content-warning";
import useAppSettings from "../../../hooks/use-app-settings";

export default function NoteContentWithWarning({ event }: { event: NostrEvent }) {
  const expand = useExpand();
  const settings = useAppSettings();

  const warning = getContentWarning(event);
  const showContentWarning = settings.showContentWarning && !!warning && !expand?.expanded;

  return showContentWarning ? (
    <ContentWarning description={typeof warning === "string" ? warning : undefined} />
  ) : (
    <TextNoteContents px="2" event={event} />
  );
}
