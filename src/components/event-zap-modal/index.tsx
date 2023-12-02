import { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { Kind } from "nostr-tools";

import { DraftNostrEvent, NostrEvent, isDTag } from "../../types/nostr-event";
import clientRelaysService from "../../services/client-relays";
import { getEventRelays } from "../../services/event-relays";
import { getZapSplits } from "../../helpers/nostr/zaps";
import { unique } from "../../helpers/array";
import { RelayMode } from "../../classes/relay";
import relayScoreboardService from "../../services/relay-scoreboard";
import { getEventCoordinate, isReplaceable } from "../../helpers/nostr/events";
import { EmbedProps } from "../embed-event";
import userRelaysService from "../../services/user-relays";
import InputStep from "./input-step";
import lnurlMetadataService from "../../services/lnurl-metadata";
import userMetadataService from "../../services/user-metadata";
import signingService from "../../services/signing";
import accountService from "../../services/account";
import PayStep from "./pay-step";
import { getInvoiceFromCallbackUrl } from "../../helpers/lnurl";
import { UserLink } from "../user-link";
import relayHintService from "../../services/event-relay-hint";

export type PayRequest = { invoice?: string; pubkey: string; error?: any };

async function getPayRequestForPubkey(
  pubkey: string,
  event: NostrEvent | undefined,
  amount: number,
  comment?: string,
  additionalRelays?: string[],
): Promise<PayRequest> {
  const metadata = userMetadataService.getSubject(pubkey).value;
  const address = metadata?.lud16 || metadata?.lud06;
  if (!address) throw new Error("User missing lightning address");
  const lnurlMetadata = await lnurlMetadataService.requestMetadata(address);

  if (!lnurlMetadata) throw new Error("LNURL endpoint unreachable");

  if (amount > lnurlMetadata.maxSendable) throw new Error("Amount to large");
  if (amount < lnurlMetadata.minSendable) throw new Error("Amount to small");

  const canZap = !!lnurlMetadata.allowsNostr && !!lnurlMetadata.nostrPubkey;
  if (!canZap) {
    // build LNURL callback url
    const callback = new URL(lnurlMetadata.callback);
    callback.searchParams.append("amount", String(amount));
    if (comment) callback.searchParams.append("comment", comment);

    const invoice = await getInvoiceFromCallbackUrl(callback);

    return { invoice, pubkey };
  }

  const userInbox = relayScoreboardService
    .getRankedRelays(
      userRelaysService
        .getRelays(pubkey)
        .value?.relays.filter((r) => r.mode & RelayMode.READ)
        .map((r) => r.url) ?? [],
    )
    .slice(0, 4);
  const eventRelays = event ? relayHintService.getEventRelayHints(event, 4) : [];
  const outbox = relayScoreboardService.getRankedRelays(clientRelaysService.getWriteUrls()).slice(0, 4);
  const additional = relayScoreboardService.getRankedRelays(additionalRelays);

  // create zap request
  const zapRequest: DraftNostrEvent = {
    kind: Kind.ZapRequest,
    created_at: dayjs().unix(),
    content: comment ?? "",
    tags: [
      ["p", pubkey],
      ["relays", ...unique([...userInbox, ...eventRelays, ...outbox, ...additional])],
      ["amount", String(amount)],
    ],
  };

  // attach "e" or "a" tag
  if (event) {
    if (isReplaceable(event.kind) && event.tags.some(isDTag)) {
      zapRequest.tags.push(["a", getEventCoordinate(event)]);
    } else zapRequest.tags.push(["e", event.id]);
  }

  // TODO: move this out to a separate step so the user can choose when to sign
  const account = accountService.current.value;
  if (!account) throw new Error("No Account");
  const signed = await signingService.requestSignature(zapRequest, account);

  // build LNURL callback url
  const callback = new URL(lnurlMetadata.callback);
  callback.searchParams.append("amount", String(amount));
  callback.searchParams.append("nostr", JSON.stringify(signed));

  const invoice = await getInvoiceFromCallbackUrl(callback);

  return { invoice, pubkey };
}

async function getPayRequestsForEvent(
  event: NostrEvent,
  amount: number,
  comment?: string,
  fallbackPubkey?: string,
  additionalRelays?: string[],
) {
  const splits = getZapSplits(event, fallbackPubkey);

  const draftZapRequests: PayRequest[] = [];
  for (const { pubkey, percent } of splits) {
    try {
      // NOTE: round to the nearest sat since there isn't support for msats yet
      const splitAmount = Math.round((amount / 1000) * percent) * 1000;
      draftZapRequests.push(await getPayRequestForPubkey(pubkey, event, splitAmount, comment, additionalRelays));
    } catch (e) {
      draftZapRequests.push({ error: e, pubkey });
    }
  }

  return draftZapRequests;
}

export type ZapModalProps = Omit<ModalProps, "children"> & {
  pubkey: string;
  event?: NostrEvent;
  relays?: string[];
  initialComment?: string;
  initialAmount?: number;
  allowComment?: boolean;
  showEmbed?: boolean;
  embedProps?: EmbedProps;
  additionalRelays?: string[];
  onZapped: () => void;
};

export default function ZapModal({
  event,
  pubkey,
  relays,
  onClose,
  initialComment,
  initialAmount,
  allowComment = true,
  showEmbed = true,
  embedProps,
  additionalRelays = [],
  onZapped,
  ...props
}: ZapModalProps) {
  const [callbacks, setCallbacks] = useState<PayRequest[]>();

  const renderContent = () => {
    if (callbacks && callbacks.length > 0) {
      return <PayStep callbacks={callbacks} onComplete={onZapped} />;
    } else {
      return (
        <InputStep
          pubkey={pubkey}
          event={event}
          initialComment={initialComment}
          initialAmount={initialAmount}
          showEmbed={showEmbed}
          embedProps={embedProps}
          allowComment={allowComment}
          onSubmit={async (values) => {
            const amountInMSats = values.amount * 1000;
            if (event) {
              setCallbacks(
                await getPayRequestsForEvent(event, amountInMSats, values.comment, pubkey, additionalRelays),
              );
            } else {
              const callback = await getPayRequestForPubkey(
                pubkey,
                event,
                amountInMSats,
                values.comment,
                additionalRelays,
              );
              setCallbacks([callback]);
            }
          }}
        />
      );
    }
  };

  return (
    <Modal onClose={onClose} size="xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader px="4" pb="0" pt="4">
          {event ? (
            "Zap Event"
          ) : (
            <>
              Zap <UserLink pubkey={pubkey} fontWeight="bold" />
            </>
          )}
        </ModalHeader>
        <ModalBody padding="4">{renderContent()}</ModalBody>
      </ModalContent>
    </Modal>
  );
}
