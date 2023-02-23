import { Button, ButtonProps, useToast } from "@chakra-ui/react";
import { makeZapRequest } from "nostr-tools/nip57";
import { useMemo, useRef, useState } from "react";
import { random } from "../../helpers/array";
import { parsePaymentRequest, readableAmountInSats } from "../../helpers/bolt11";
import { parseZapNote, totalZaps } from "../../helpers/nip-57";
import { useCurrentAccount } from "../../hooks/use-current-account";
import useEventZaps from "../../hooks/use-event-zaps";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { useSigningContext } from "../../providers/signing-provider";
import clientRelaysService from "../../services/client-relays";
import { getEventRelays } from "../../services/event-relays";
import eventZapsService from "../../services/event-zaps";
import lnurlMetadataService from "../../services/lnurl-metadata";
import { NostrEvent } from "../../types/nostr-event";
import { LightningIcon } from "../icons";

export default function NoteZapButton({ note, ...props }: { note: NostrEvent } & Omit<ButtonProps, "children">) {
  const { requestSignature } = useSigningContext();
  const account = useCurrentAccount();
  const metadata = useUserMetadata(note.pubkey);
  const zaps = useEventZaps(note.id) ?? [];
  const parsedZaps = useMemo(() => {
    const parsed = [];
    for (const zap of zaps) {
      try {
        parsed.push(parseZapNote(zap));
      } catch (e) {}
    }
    return parsed;
  }, [zaps]);
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const timeout = useRef(0);
  const zapAmount = useRef(0);

  const hasZapped = parsedZaps.some((zapRequest) => zapRequest.request.pubkey === account.pubkey);
  const tipAddress = metadata?.lud06 || metadata?.lud16;

  const handleClick = () => {
    if (!tipAddress) return;
    if (timeout.current) {
      window.clearTimeout(timeout.current);
    }
    zapAmount.current += 21;
    timeout.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const eventRelays = getEventRelays(note.id).value;
        const readRelays = clientRelaysService.getReadUrls();
        const lnurlMetadata = await lnurlMetadataService.requestMetadata(tipAddress);
        const amount = zapAmount.current * 1000;

        if (lnurlMetadata && lnurlMetadata.allowsNostr && lnurlMetadata.nostrPubkey) {
          const zapRequest = makeZapRequest({
            profile: note.pubkey,
            event: note.id,
            // pick a random relay from the event and one of our read relays
            relays: [random(eventRelays), random(readRelays)],
            amount,
            comment: "",
          });

          const signed = await requestSignature(zapRequest);
          if (signed) {
            if (amount > lnurlMetadata.maxSendable) throw new Error("amount to large");
            if (amount < lnurlMetadata.minSendable) throw new Error("amount to small");

            const url = new URL(lnurlMetadata.callback);
            url.searchParams.append("amount", String(zapAmount.current * 1000));
            url.searchParams.append("nostr", JSON.stringify(signed));

            const { pr: payRequest } = await fetch(url).then((res) => res.json());
            if (payRequest as string) {
              const parsed = parsePaymentRequest(payRequest);
              if (parsed.amount !== amount) throw new Error("incorrect amount");

              if (window.webln) {
                await window.webln.enable();
                await window.webln.sendPayment(payRequest);

                // fetch the zaps again
                eventZapsService.requestZaps(note.id, readRelays, true);
              } else {
                window.addEventListener(
                  "focus",
                  () => {
                    // when the window regains focus, fetch the zaps again
                    eventZapsService.requestZaps(note.id, readRelays, true);
                  },
                  { once: true }
                );
                window.open("lightning:" + payRequest);
              }
            }
          }
        } else {
          // show standard tipping
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log(e);
          toast({
            status: "error",
            description: e.message,
          });
        }
      }
      zapAmount.current = 0;
      setLoading(false);
    }, 1500);
  };

  return (
    <Button
      leftIcon={<LightningIcon color="yellow.500" />}
      aria-label="Zap Note"
      title="Zap Note"
      colorScheme={hasZapped ? "brand" : undefined}
      {...props}
      isLoading={loading}
      onClick={handleClick}
      isDisabled={!tipAddress}
    >
      {readableAmountInSats(totalZaps(zaps), false)}
    </Button>
  );
}
