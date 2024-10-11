import { replaceDomain } from "../../../helpers/url";
import useAppSettings from "../../../hooks/use-app-settings";
import { renderOpenGraphUrl } from "./common";

// copied from https://github.com/SimonBrazell/privacy-redirect/blob/master/src/assets/javascripts/helpers/twitter.js
export const TWITTER_DOMAINS = ["x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com", "pbs.twimg.com"];

function TwitterLink({ url, isLineEnd }: { url: URL; isLineEnd?: boolean }) {
  const { twitterRedirect } = useAppSettings();
  if (twitterRedirect) return renderOpenGraphUrl(replaceDomain(url, twitterRedirect), !!isLineEnd);
  else return renderOpenGraphUrl(url, !!isLineEnd);
}

export function renderTwitterUrl(match: URL, isLineEnd: boolean) {
  if (!TWITTER_DOMAINS.includes(match.hostname)) return null;

  return <TwitterLink url={match} isLineEnd={isLineEnd} />;
}
