import { decodeLNURL } from "applesauce-core/helpers";

export function isLNURL(lnurl: string) {
  try {
    return !!decodeLNURL(lnurl);
  } catch (e) {
    return false;
  }
}
