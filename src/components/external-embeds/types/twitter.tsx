import { Link } from "applesauce-content/nast";

import { renderOpenGraphUrl } from "./common";
import { replaceDomain } from "../../../helpers/url";
import useAppSettings from "../../../hooks/use-app-settings";

// copied from https://github.com/SimonBrazell/privacy-redirect/blob/master/src/assets/javascripts/helpers/twitter.js
export const TWITTER_DOMAINS = ["x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com", "pbs.twimg.com"];

function TwitterLink({ url, node }: { url: URL; node: Link }) {
  const { twitterRedirect } = useAppSettings();
  if (twitterRedirect) return renderOpenGraphUrl(replaceDomain(url, twitterRedirect), node);
  else return renderOpenGraphUrl(url, node);
}

export function renderTwitterUrl(match: URL, node: Link) {
  if (!TWITTER_DOMAINS.includes(match.hostname)) return null;

  return <TwitterLink url={match} node={node} />;
}
