import { replaceDomain } from "../../helpers/url";
import appSettings from "../../services/settings/app-settings";
import { renderOpenGraphUrl } from "./common";

// copied from https://github.com/SimonBrazell/privacy-redirect/blob/master/src/assets/javascripts/helpers/twitter.js
export const TWITTER_DOMAINS = ["twitter.com", "www.twitter.com", "mobile.twitter.com", "pbs.twimg.com"];

export function renderTwitterUrl(match: URL, isLineEnd: boolean) {
  if (!TWITTER_DOMAINS.includes(match.hostname)) return null;

  const { twitterRedirect } = appSettings.value;
  if (twitterRedirect) return renderOpenGraphUrl(replaceDomain(match, twitterRedirect), isLineEnd);
  else return renderOpenGraphUrl(match, isLineEnd);
}
