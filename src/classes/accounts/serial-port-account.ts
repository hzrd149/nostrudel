import SerialPortSigner from "../signers/serial-port-signer";
import { Account } from "./account";

export default class SerialPortAccount extends Account {
  readonly type = "serial";
  signer: SerialPortSigner;

  constructor(pubkey: string) {
    super(pubkey);
    this.signer = new SerialPortSigner();
  }
}
