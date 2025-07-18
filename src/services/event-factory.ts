import { EventFactory } from "applesauce-factory";

import { getEventRelayHint, getPubkeyRelayHint } from "./relay-hints";
import { NIP_89_CLIENT_APP } from "../const";
import accounts from "./accounts";
import localSettings from "./preferences";

const factory = new EventFactory({
  signer: accounts.signer,
  getEventRelayHint,
  getPubkeyRelayHint: getPubkeyRelayHint,
  client: localSettings.addClientTag.value ? NIP_89_CLIENT_APP : undefined,
});

// update event factory when settings change
localSettings.addClientTag.subscribe((client) => {
  if (client) factory.context.client = NIP_89_CLIENT_APP;
  else factory.context.client = undefined;
});

export default factory;
