import { useParams } from "react-router-dom";

export default function useServerUrlParam(key = "server"): string {
  const params = useParams<string>();
  let server = params[key];
  if (!server) throw new Error("No server url");

  // aislop-ignore-next-line ai-slop/hardcoded-url -- adds the https scheme to a bare host typed into the blossom server route; the host is whatever the user navigated to, so there is no fixed URL to centralise
  if (!server.startsWith("http")) server = `https://${server}`;
  if (!URL.canParse(server)) throw new Error("Bad server url");

  return new URL(server).toString();
}
