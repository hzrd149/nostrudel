import accountService from "../services/account";
import useSubject from "./use-subject";

export function useReadonlyMode() {
  return useSubject(accountService.readonly);
}
