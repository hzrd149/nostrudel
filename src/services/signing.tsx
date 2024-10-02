import { EventTemplate, getEventHash, NostrEvent, UnsignedEvent } from "nostr-tools";

import { Account } from "../classes/accounts/account";
import PasswordAccount from "../classes/accounts/password-account";

class SigningService {
  async unlockAccount(account: Account) {
    if (account instanceof PasswordAccount && !account.signer.unlocked) {
      const password = window.prompt("Account unlock password");
      if (!password) throw new Error("Password required");
      await account.signer.unlock(password);
    }
  }

  async finalizeDraft(draft: EventTemplate, account: Account): Promise<UnsignedEvent> {
    return {
      ...draft,
      pubkey: account.pubkey,
    };
  }

  async requestSignature(draft: EventTemplate, account: Account) {
    const checkSig = (signed: NostrEvent) => {
      if (signed.pubkey !== account.pubkey) throw new Error("Signed with the wrong pubkey");
    };

    if (account.readonly) throw new Error("Cant with read only account");
    await this.unlockAccount(account);

    if (!account.signer) throw new Error("Account missing signer");
    const signed = await account.signer.signEvent(draft);
    checkSig(signed);
    return signed;
  }

  async nip04Encrypt(plaintext: string, pubkey: string, account: Account) {
    if (account.readonly) throw new Error("Can not encrypt in readonly mode");
    await this.unlockAccount(account);

    if (!account.signer) throw new Error("Account missing signer");
    if (!account.signer.nip04) throw new Error("Signer does not support NIP-04");
    return account.signer.nip04.encrypt(pubkey, plaintext);
  }

  async nip04Decrypt(ciphertext: string, pubkey: string, account: Account) {
    if (account.readonly) throw new Error("Can not decrypt in readonly mode");
    await this.unlockAccount(account);

    if (!account.signer) throw new Error("Account missing signer");
    if (!account.signer.nip04) throw new Error("Signer does not support NIP-04");
    return account.signer.nip04.decrypt(pubkey, ciphertext);
  }

  async nip44Encrypt(plaintext: string, pubkey: string, account: Account) {
    if (account.readonly) throw new Error("Can not encrypt in readonly mode");
    await this.unlockAccount(account);

    if (!account.signer) throw new Error("Account missing signer");
    if (!account.signer.nip44) throw new Error("Signer does not support NIP-44");
    return account.signer.nip44.encrypt(pubkey, plaintext);
  }

  async nip44Decrypt(ciphertext: string, pubkey: string, account: Account) {
    if (account.readonly) throw new Error("Can not decrypt in readonly mode");
    await this.unlockAccount(account);

    if (!account.signer) throw new Error("Account missing signer");
    if (!account.signer.nip44) throw new Error("Signer does not support NIP-44");
    return account.signer.nip44.decrypt(pubkey, ciphertext);
  }

  async nip17Encrypt(plaintext: string, pubkey: string, account: Account) {
    if (account.readonly) throw new Error("Can not encrypt in readonly mode");
    await this.unlockAccount(account);

    if (!account.signer) throw new Error("Account missing signer");
    if (!account.signer.nip17) throw new Error("Signer does not support NIP-17");
    return account.signer.nip17.encrypt(pubkey, plaintext);
  }

  async nip17Decrypt(ciphertext: string, pubkey: string, account: Account) {
    if (account.readonly) throw new Error("Can not decrypt in readonly mode");
    await this.unlockAccount(account);

    if (!account.signer) throw new Error("Account missing signer");
    if (!account.signer.nip17) throw new Error("Signer does not support NIP-17");
    return account.signer.nip17.decrypt(pubkey, ciphertext);
  }
}

const signingService = new SigningService();

export default signingService;
