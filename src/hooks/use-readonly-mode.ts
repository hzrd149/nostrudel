import identityService from "../services/identity";
import useSubject from "./use-subject";

export function useReadonlyMode() {
  return useSubject(identityService.readonly);
}
