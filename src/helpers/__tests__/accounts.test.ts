import { describe, expect, it } from "vitest";
import { type SerializedAccount } from "applesauce-accounts";

import { LEGACY_ANDROID_ACCOUNT_TYPE, migrateLegacyAccountTypes } from "../accounts";

const pubkey = "a".repeat(64);

describe("migrateLegacyAccountTypes", () => {
  it("renames legacy android signer accounts to the applesauce android-native type", () => {
    const legacy: SerializedAccount<any, any> = {
      id: "legacy",
      type: LEGACY_ANDROID_ACCOUNT_TYPE,
      pubkey,
      signer: { packageName: "com.greenart7c3.nostrsigner" },
      metadata: { name: "phone" },
    };

    expect(migrateLegacyAccountTypes([legacy])).toEqual([{ ...legacy, type: "android-native" }]);
  });

  it("leaves other account types untouched", () => {
    const extension: SerializedAccount<any, any> = { id: "ext", type: "extension", pubkey, signer: undefined };

    expect(migrateLegacyAccountTypes([extension])[0]).toBe(extension);
  });
});
