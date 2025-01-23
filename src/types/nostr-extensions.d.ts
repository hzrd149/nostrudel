import { Nip07Interface } from "applesauce-signer";

declare global {
  interface Window {
    nostr?: Nip07Interface;
  }
}
