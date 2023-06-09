import { replaceDomain } from "../../helpers/url";
import appSettings from "../../services/app-settings";
import { TweetEmbed } from "../tweet-embed";
import { renderGenericUrl } from "./common";

// copied from https://github.com/SimonBrazell/privacy-redirect/blob/master/src/assets/javascripts/helpers/twitter.js
export const TWITTER_DOMAINS = ["twitter.com", "www.twitter.com", "mobile.twitter.com", "pbs.twimg.com"];

export function renderTwitterUrl(match: URL) {
  if (!TWITTER_DOMAINS.includes(match.hostname)) return null;

  const { twitterRedirect } = appSettings.value;
  if (twitterRedirect) return renderGenericUrl(replaceDomain(match, twitterRedirect));
  else return <TweetEmbed href={match.toString()} conversation={false} />;
}
