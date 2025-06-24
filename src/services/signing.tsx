import { EventTemplate, UnsignedEvent, VerifiedEvent } from "nostr-tools";
import { IAccount } from "applesauce-accounts";

import verifyEvent from "./verify-event";
import { PasswordAccount } from "applesauce-accounts/accounts";

/** @deprecated */
class SigningService {
  async unlockAccount(account: IAccount) {
    if (account instanceof PasswordAccount && !account.signer.unlocked) {
      const password = window.prompt("Account unlock password");
      if (!password) throw new Error("Password required");
      await account.signer.unlock(password);
    }
  }

  async finalizeDraft(draft: EventTemplate, account: IAccount): Promise<UnsignedEvent> {
    return {
      ...draft,
      pubkey: account.pubkey,
    };
  }

  async requestSignature(draft: UnsignedEvent | EventTemplate, account: IAccount): Promise<VerifiedEvent> {
    await this.unlockAccount(account);

    if (!Reflect.has(draft, "pubkey")) draft = await this.finalizeDraft(draft, account);

    if (!account.signer) throw new Error("Account missing signer");
    const signed = await account.signer.signEvent(draft);
    if (signed.pubkey !== account.pubkey) throw new Error("Signed with the wrong pubkey");

    if (!verifyEvent(signed)) throw new Error("Invalid signature");

    return signed;
  }

  async nip04Encrypt(plaintext: string, pubkey: string, account: IAccount) {
    await this.unlockAccount(account);

    if (!account.signer) throw new Error("Account missing signer");
    if (!account.signer.nip04) throw new Error("Signer does not support NIP-04");
    return account.signer.nip04.encrypt(pubkey, plaintext);
  }

  async nip04Decrypt(ciphertext: string, pubkey: string, account: IAccount) {
    await this.unlockAccount(account);

    if (!account.signer) throw new Error("Account missing signer");
    if (!account.signer.nip04) throw new Error("Signer does not support NIP-04");
    return account.signer.nip04.decrypt(pubkey, ciphertext);
  }

  async nip44Encrypt(plaintext: string, pubkey: string, account: IAccount) {
    await this.unlockAccount(account);

    if (!account.signer) throw new Error("Account missing signer");
    if (!account.signer.nip44) throw new Error("Signer does not support NIP-44");
    return account.signer.nip44.encrypt(pubkey, plaintext);
  }

  async nip44Decrypt(ciphertext: string, pubkey: string, account: IAccount) {
    await this.unlockAccount(account);

    if (!account.signer) throw new Error("Account missing signer");
    if (!account.signer.nip44) throw new Error("Signer does not support NIP-44");
    return account.signer.nip44.decrypt(pubkey, ciphertext);
  }
}

/** @deprecated use AccountManager.active instead */
const signingService = new SigningService();

export default signingService;
