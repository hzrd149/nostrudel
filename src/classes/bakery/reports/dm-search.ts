import { BehaviorSubject } from "rxjs";
import { ReportResults } from "@satellite-earth/core/types";

import Report from "./report";
import { getDMRecipient, getDMSender } from "../../../helpers/nostr/dms";

function sortPubkeys(a: string, b: string): [string, string] {
  if (a < b) return [a, b];
  else return [b, a];
}

export type ConversationResult = {
  id: string;
  pubkeys: [string, string];
  results: ReportResults["DM_SEARCH"][];
};

export default class DMSearchReport extends Report<"DM_SEARCH"> {
  readonly type = "DM_SEARCH";

  results = new BehaviorSubject<ReportResults["DM_SEARCH"][]>([]);
  conversations = new BehaviorSubject<ConversationResult[]>([]);

  onFire() {
    this.results.next([]);
    this.conversations.next([]);
  }
  handleResult(result: ReportResults["DM_SEARCH"]) {
    this.results.next([...this.results.value, result]);

    // add to conversations
    const sender = getDMSender(result.event);
    const recipient = getDMRecipient(result.event);

    const pubkeys = sortPubkeys(sender, recipient);
    const id = pubkeys.join(":");

    if (this.conversations.value.some((c) => c.id === id)) {
      // replace the conversation object
      this.conversations.next(
        this.conversations.value.map((c) => {
          if (c.id === id) return { id, pubkeys, results: [...c.results, result] };
          return c;
        }),
      );
    } else {
      // add new conversation
      this.conversations.next([...this.conversations.value, { id, pubkeys, results: [result] }]);
    }
  }
}
