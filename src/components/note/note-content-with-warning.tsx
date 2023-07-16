import { NostrEvent } from "../../types/nostr-event";

import { NoteContents } from "./note-contents";
import { useExpand } from "./expanded";
import SensitiveContentWarning from "../sensitive-content-warning";
import useAppSettings from "../../hooks/use-app-settings";

export default function NoteContentWithWarning({ event }: { event: NostrEvent }) {
  const expand = useExpand();
  const settings = useAppSettings();

  const contentWarning = event.tags.find((t) => t[0] === "content-warning")?.[1];
  const showContentWarning = settings.showContentWarning && contentWarning && !expand?.expanded;

  return showContentWarning ? <SensitiveContentWarning description={contentWarning} /> : <NoteContents event={event} />;
}
