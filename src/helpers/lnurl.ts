import { decodeLNURL } from "applesauce-common/helpers";

export function isLNURL(lnurl: string) {
  try {
    return !!decodeLNURL(lnurl);
  } catch {
    return false;
  }
}
