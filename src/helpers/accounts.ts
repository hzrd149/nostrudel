import { type SerializedAccount } from "applesauce-accounts";
import { AndroidNativeAccount } from "applesauce-accounts/accounts/android-native-account";

export const LEGACY_ANDROID_ACCOUNT_TYPE = "android-signer";

/** Renames saved legacy account types to the applesauce equivalents so they keep loading */
export function migrateLegacyAccountTypes(accounts: SerializedAccount<any, any>[]): SerializedAccount<any, any>[] {
  return accounts.map((account) =>
    account.type === LEGACY_ANDROID_ACCOUNT_TYPE ? { ...account, type: AndroidNativeAccount.type } : account,
  );
}
