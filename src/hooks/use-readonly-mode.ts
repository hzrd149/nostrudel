import identity from "../services/identity";
import useSubject from "./use-subject";

export function useReadonlyMode() {
  return useSubject(identity.readonly);
}
