import accountService from "../services/account";
import useSubject from "./use-subject";

export function useCurrentAccount() {
  const account = useSubject(accountService.current);
  if (!account) throw Error("no account");
  return account;
}
