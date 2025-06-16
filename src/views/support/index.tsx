import { Box, Button, Divider, Flex, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { getTagValue, getZapPayment, unixNow } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import confetti from "canvas-confetti";
import dayjs from "dayjs";
import { kinds } from "nostr-tools";
import { useEffect, useState } from "react";

import { PayRequest } from "../../components/event-zap-modal";
import PayStep from "../../components/event-zap-modal/pay-step";
import { LightningIcon } from "../../components/icons";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { SUPPORT_PUBKEY } from "../../const";
import { isProfileZap } from "../../helpers/nostr/zaps";
import { useReadRelays } from "../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useUserInbox } from "../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { eventStore } from "../../services/event-store";
import { NotQuiteTopZap } from "./components/not-quite-top-zap";
import { OtherZap } from "./components/other-zap";
import SupportForm from "./components/support-form";
import { TopZap } from "./components/top-zap";

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function fireworks(duration: number = 10_000) {
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

const aMonthAgo = dayjs().subtract(1, "month").unix();

export default function SupportView() {
  const zaps = useEventModel(TimelineModel, [{ kinds: [kinds.Zap], "#p": [SUPPORT_PUBKEY], since: aMonthAgo }]);
  const form = useDisclosure();
  const [request, setRequest] = useState<PayRequest>();

  const supportInbox = useUserInbox(SUPPORT_PUBKEY);
  const readRelays = useReadRelays(supportInbox);
  const { loader } = useTimelineLoader("support-zaps", readRelays, {
    kinds: [kinds.Zap],
    "#p": [SUPPORT_PUBKEY],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  const support = zaps
    ?.filter((zap) => isProfileZap(zap))
    .sort((a, b) => (getZapPayment(b)?.amount ?? 0) - (getZapPayment(a)?.amount ?? 0) || b.created_at - a.created_at);

  // close the pay request when new zap is received
  useEffect(() => {
    if (request) {
      const sub = eventStore.filters([{ kinds: [kinds.Zap], since: unixNow() }]).subscribe((event) => {
        try {
          const bont11 = getTagValue(event, "bolt11");

          if (bont11 === request.invoice) {
            setRequest(undefined);

            fireworks();
          }
        } catch (error) {}
      });

      return () => sub.unsubscribe();
    }
  }, [request]);

  return (
    <>
      <VerticalPageLayout alignItems="center">
        <IntersectionObserverProvider callback={callback}>
          <Box textAlign="center">
            <Heading>Top Supporters</Heading>
            <Text color="GrayText">In the last month</Text>
          </Box>
          {support?.[0] && <TopZap zap={support[0]} />}
          {support && support.length > 1 && (
            <Flex gap="2" direction="column" w="full" pl={{ base: 6, lg: 0 }} alignItems="center">
              <Divider maxW="4xl" mt="10" mb="5" />
              {support?.[1] && <NotQuiteTopZap zap={support[1]} color="pink.500" />}
              {support?.[2] && <NotQuiteTopZap zap={support[2]} color="green.500" />}
              <Divider maxW="4xl" mt="10" mb="5" />
            </Flex>
          )}

          {request ? (
            <PayStep callbacks={[request]} onComplete={() => setRequest(undefined)} w="full" maxW="2xl" mb="4" />
          ) : form.isOpen ? (
            <SupportForm
              w="full"
              maxW="2xl"
              mb="4"
              onSubmit={(r) => {
                setRequest(r);
                form.onClose();
              }}
            />
          ) : (
            <Button
              size="lg"
              leftIcon={<LightningIcon />}
              colorScheme="primary"
              mb="4"
              w="full"
              maxW="sm"
              onClick={form.onOpen}
            >
              Support
            </Button>
          )}

          {(support?.length ?? 0) > 3 && <>{support?.slice(3).map((zap) => <OtherZap key={zap.id} zap={zap} />)}</>}
        </IntersectionObserverProvider>
      </VerticalPageLayout>
    </>
  );
}
