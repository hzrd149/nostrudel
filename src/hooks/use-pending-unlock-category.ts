import { use$ } from "applesauce-react/hooks";

import { PendingUnlockState, pendingUnlockState$ } from "../services/pending-unlock";

/**
 * Reads one registered pending-unlock category's live state by id, sourced from the single
 * pending-unlock registry rather than a second local computation — this is what keeps the
 * side-nav badge and any other surface reading the same category id from ever disagreeing.
 */
export default function usePendingUnlockCategory(id: string): PendingUnlockState | undefined {
  const state = use$(pendingUnlockState$);
  return state?.find((row) => row.category.id === id);
}
