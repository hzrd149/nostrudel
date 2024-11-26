import { useObservable } from "applesauce-react/hooks";
import accountService from "../services/account";

export default function useCurrentAccount() {
  return useObservable(accountService.current);
}
