import { IconProps, Tooltip } from "@chakra-ui/react";
import { nip13, NostrEvent } from "nostr-tools";

import Dice1 from "../icons/dice-1";
import Dice2 from "../icons/dice-2";
import Dice3 from "../icons/dice-3";
import Dice4 from "../icons/dice-4";
import Dice5 from "../icons/dice-5";
import Dice6 from "../icons/dice-6";

export default function POWIcon({ event, ...props }: IconProps & { event: NostrEvent }) {
  const pow = nip13.getPow(event.id);
  if (pow < 8) return null;

  let Icon = Dice1;
  if (pow >= 16) Icon = Dice2;
  if (pow >= 24) Icon = Dice3;
  if (pow >= 32) Icon = Dice3;
  if (pow >= 48) Icon = Dice4;
  if (pow >= 64) Icon = Dice5;
  if (pow >= 86) Icon = Dice6;

  return (
    <Tooltip label={String(pow)}>
      <Icon {...props} />
    </Tooltip>
  );
}
