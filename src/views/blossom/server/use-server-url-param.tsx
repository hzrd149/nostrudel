import { useParams } from "react-router-dom";

export default function useServerUrlParam(key = "server"): string {
  const params = useParams<string>();
  let server = params[key];
  if (!server) throw new Error("No server url");

  if (!server.startsWith("http")) server = `https://${server}`;
  if (!URL.canParse(server)) throw new Error("Bad server url");

  return new URL(server).toString();
}
