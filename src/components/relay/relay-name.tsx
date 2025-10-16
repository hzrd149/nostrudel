import { useRelayInfo } from "../../hooks/use-relay-info";

export type RelyNameProps = {
  relay: string;
};

export default function RelayName({ relay }: RelyNameProps) {
  const name = relay.replace("wss://", "").replace("ws://", "");

  return <span>{name}</span>;
}
