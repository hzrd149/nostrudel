import { Note } from "applesauce-common/casts";

import { sortByDate } from "../../helpers/nostr/event";
import { countDescendantsInStore } from "../../helpers/nostr/descendant-count";

export { countDescendantsInStore };

export function repliesByDate(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => sortByDate(a.event, b.event));
}
