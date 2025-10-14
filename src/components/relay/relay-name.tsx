import { useRelayInfo } from "../../hooks/use-relay-info";

export type RelyNameProps = {
  relay: string;
};

export default function RelayName({ relay }: RelyNameProps) {
  const { info } = useRelayInfo(relay);
  const name = info?.name || relay.replace("wss://", "").replace("ws://", "");

  return <span>{name}</span>;
}
