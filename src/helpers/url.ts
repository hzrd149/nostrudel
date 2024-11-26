import { convertToUrl } from "applesauce-core/helpers/url";
export * from "applesauce-core/helpers/url";

export function replaceDomain(url: string | URL, replacementUrl: string | URL) {
  const newUrl = new URL(url);
  replacementUrl = convertToUrl(replacementUrl);
  newUrl.host = replacementUrl.host;
  newUrl.protocol = replacementUrl.protocol;
  if (replacementUrl.port) newUrl.port = replacementUrl.port;
  if (replacementUrl.username) newUrl.username = replacementUrl.username;
  if (replacementUrl.password) newUrl.password = replacementUrl.password;
  return newUrl;
}
