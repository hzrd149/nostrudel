import accountService from "../services/account";
import useSubject from "./use-subject";

export default function useCurrentAccount() {
  return useSubject(accountService.current);
}
