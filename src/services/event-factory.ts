import { BehaviorSubject, Observable } from "rxjs";
import { EventFactory } from "applesauce-factory";
import { Account } from "../classes/accounts/account";
import { getEventRelayHint, getPubkeyRelayHint } from "./event-relay-hint";
import { NIP_89_CLIENT_APP } from "../const";
import accountService from "./account";

class EventFactoryService {
  subject = new BehaviorSubject<EventFactory | null>(null);

  get factory() {
    return this.subject.value;
  }

  constructor(account: Observable<Account | null>) {
    account.subscribe((current) => {
      if (!current) this.subject.next(null);
      else
        this.subject.next(
          new EventFactory({
            signer: current.signer,
            getRelayHint: getEventRelayHint,
            getPubkeyRelayHint: getPubkeyRelayHint,
            client: NIP_89_CLIENT_APP,
          }),
        );
    });
  }
}

const eventFactoryService = new EventFactoryService(accountService.current);

export default eventFactoryService;
