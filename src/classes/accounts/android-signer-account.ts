import { AppInfo, NostrSignerPlugin } from "nostr-signer-capacitor-plugin";
import { BaseAccount, SerializedAccount } from "applesauce-accounts";
import AndroidNativeSigner from "../signers/android-native-signer";

type SignerData = {
  packageName: string;
};

export default class AndroidSignerAccount<Metadata extends unknown> extends BaseAccount<
  AndroidNativeSigner,
  SignerData,
  Metadata
> {
  static type = "android-signer";

  static async getSignerApps() {
    return (await NostrSignerPlugin.getInstalledSignerApps()).apps;
  }

  toJSON() {
    return super.saveCommonFields({
      signer: { packageName: this.signer.packageName },
    });
  }

  static fromJSON<Metadata extends unknown>(
    json: SerializedAccount<SignerData, Metadata>,
  ): AndroidSignerAccount<Metadata> {
    const signer = new AndroidNativeSigner(json.signer.packageName);
    return new AndroidSignerAccount(json.pubkey, signer);
  }

  static async fromApp<Metadata extends unknown>(app: AppInfo): Promise<AndroidSignerAccount<Metadata>> {
    const signer = new AndroidNativeSigner(app.packageName);
    const pubkey = await signer.getPublicKey();
    return new AndroidSignerAccount<Metadata>(pubkey, signer);
  }
}
