import { useCurrentAccount } from "./use-current-account";

/** @deprecated */
export function useReadonlyMode() {
  const account = useCurrentAccount();
  return account.readonly;
}
