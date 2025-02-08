import { BehaviorSubject, combineLatest } from "rxjs";
import { EventFactory } from "applesauce-factory";
import { map } from "rxjs/operators";

import { getEventRelayHint, getPubkeyRelayHint } from "./relay-hints";
import { NIP_89_CLIENT_APP } from "../const";
import localSettings from "./local-settings";
import accounts from "./accounts";

const factory$ = new BehaviorSubject<EventFactory>(
  new EventFactory({
    signer: accounts.active ?? undefined,
    getEventRelayHint,
    getPubkeyRelayHint: getPubkeyRelayHint,
    client: localSettings.addClientTag.value ? NIP_89_CLIENT_APP : undefined,
  }),
);

// update event factory when settings change
combineLatest([accounts.active$, localSettings.addClientTag]).pipe(
  map(([current, client]) => {
    return new EventFactory({
      signer: current ? current.signer : undefined,
      getEventRelayHint,
      getPubkeyRelayHint: getPubkeyRelayHint,
      client: client ? NIP_89_CLIENT_APP : undefined,
    });
  }),
);

export default factory$;
