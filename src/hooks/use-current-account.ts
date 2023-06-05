import accountService from "../services/account";
import useSubject from "./use-subject";

export function useCurrentAccount() {
  return useSubject(accountService.current);
}
