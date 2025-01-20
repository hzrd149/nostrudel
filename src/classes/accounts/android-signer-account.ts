import { AppInfo, NostrSignerPlugin } from "nostr-signer-capacitor-plugin";
import { Account } from "./account";
import AndroidNativeSigner from "../signers/android-native-signer";

export default class AndroidSignerAccount extends Account {
  readonly type = "android-signer";

  declare protected _signer?: AndroidNativeSigner;
  override get signer() {
    if (!this._signer) throw new Error("Signer not setup");
    return this._signer;
  }
  set signer(signer: AndroidNativeSigner) {
    this._signer = signer;
  }

  static async getSignerApps() {
    return (await NostrSignerPlugin.getInstalledSignerApps()).apps;
  }

  static async fromApp(app: AppInfo) {
    const signer = new AndroidNativeSigner(app.packageName);
    const pubkey = await signer.getPublicKey();
    const account = new AndroidSignerAccount(pubkey);
    account.signer = signer;
    return account;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      packageName: this.signer.packageName,
    };
  }

  fromJSON(data: any): this {
    super.fromJSON(data);

    this.signer = new AndroidNativeSigner(data.packageName);

    return this;
  }
}
