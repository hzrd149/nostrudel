import { isSafeRelayURL } from "applesauce-core/helpers";
import { useParams } from "react-router-dom";

export default function useRelayUrlParam(key = "relay"): string {
  const params = useParams<string>();
  const relay = params[key];
  if (!relay) throw new Error("No relay url");

  if (!isSafeRelayURL(relay)) throw new Error("Bad relay url");

  return relay;
}
