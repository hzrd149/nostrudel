import debug from "debug";
import userMetadataService from "../services/user-metadata";

export const logger = debug("noStrudel");

debug.enable("noStrudel:*");

export function nameOrPubkey(pubkey: string) {
  const parsed = userMetadataService.getSubject(pubkey).value;
  return parsed?.name || parsed?.display_name || pubkey;
}
