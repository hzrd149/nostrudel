import { replaceDomain } from "../../../helpers/url";
import useAppSettings from "../../../hooks/use-user-app-settings";
import { renderGenericUrl } from "./common";

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

function RedditLink({ url }: { url: URL }) {
  const { redditRedirect } = useAppSettings();
  const fixed = redditRedirect ? replaceDomain(url, redditRedirect) : url;

  return renderGenericUrl(fixed);
}

const bypassPaths = /\/(gallery\/poll\/rpan\/settings\/topics)/;
export function renderRedditUrl(match: URL) {
  if (!REDDIT_DOMAINS.includes(match.hostname)) return null;
  if (match.pathname.match(bypassPaths)) return null;

  return <RedditLink url={match} />;
}
