import { BehaviorSubject, Observable } from "rxjs";
import { EventFactory } from "applesauce-factory";
import { combineLatest } from "rxjs";

import { Account } from "../classes/accounts/account";
import { getEventRelayHint, getPubkeyRelayHint } from "./relay-hints";
import { NIP_89_CLIENT_APP } from "../const";
import accountService from "./account";
import localSettings from "./local-settings";

class EventFactoryService {
  subject = new BehaviorSubject<EventFactory | null>(null);

  get factory() {
    return this.subject.value;
  }

  constructor(account: Observable<Account | null>, includeClient: Observable<boolean>) {
    combineLatest([account, includeClient]).subscribe(([current, client]) => {
      this.subject.next(
        new EventFactory({
          signer: current ? current.signer : undefined,
          getRelayHint: getEventRelayHint,
          getPubkeyRelayHint: getPubkeyRelayHint,
          client: client ? NIP_89_CLIENT_APP : undefined,
        }),
      );
    });
  }
}

const eventFactoryService = new EventFactoryService(accountService.current, localSettings.addClientTag);

export default eventFactoryService;
