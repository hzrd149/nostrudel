import { replaceDomain } from "../../helpers/url";
import appSettings from "../../services/app-settings";
import { renderDefaultUrl } from "./common";

// copied from https://github.com/SimonBrazell/privacy-redirect/blob/master/src/assets/javascripts/helpers/reddit.js
const REDDIT_DOMAINS = [
  "www.reddit.com",
  "np.reddit.com",
  "new.reddit.com",
  "amp.reddit.com",
  "i.redd.it",
  "redd.it",
  "old.reddit.com",
];

const bypassPaths = /\/(gallery\/poll\/rpan\/settings\/topics)/;
export function renderRedditUrl(match: URL) {
  if (!REDDIT_DOMAINS.includes(match.hostname)) return null;
  if (match.pathname.match(bypassPaths)) return null;

  const { redditRedirect } = appSettings.value;
  const fixed = redditRedirect ? replaceDomain(match, redditRedirect) : match;

  return renderDefaultUrl(fixed);
}
