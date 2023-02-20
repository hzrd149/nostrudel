import { Box, Button, Flex, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import moment from "moment";
import { useOutletContext } from "react-router-dom";
import { ErrorBoundary, ErrorFallback } from "../../components/error-boundary";
import QuoteNote from "../../components/note/quote-note";
import { UserAvatarLink } from "../../components/user-avatar-link";
import { UserLink } from "../../components/user-link";
import { readableAmountInSats } from "../../helpers/bolt11";
import { convertTimestampToDate } from "../../helpers/date";
import { isProfileZap, parseZapNote } from "../../helpers/nip57";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";

const ZapNote = ({ zapEvent }: { zapEvent: NostrEvent }) => {
  const { isOpen, onToggle } = useDisclosure();
  try {
    const { request, payment, eventId } = parseZapNote(zapEvent);

    return (
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        padding="2"
        display="flex"
        gap="2"
        flexDirection="column"
      >
        <Flex gap="2" alignItems="center" wrap="wrap">
          <UserAvatarLink pubkey={request.pubkey} size="xs" />
          <UserLink pubkey={request.pubkey} />
          {payment.amount && <Text>{readableAmountInSats(payment.amount)}</Text>}
          {request.content && (
            <Button variant="link" onClick={onToggle}>
              Show message
            </Button>
          )}
          <Text ml="auto">{moment(convertTimestampToDate(request.created_at)).fromNow()}</Text>
        </Flex>
        {request.content && isOpen && <Text>{request.content}</Text>}
        {eventId && <QuoteNote noteId={eventId} />}
      </Box>
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(e);

      return <ErrorFallback error={e} resetErrorBoundary={() => {}} />;
    }
    return null;
  }
};

const UserZapsTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useReadRelayUrls();

  const { events, loading, loadMore } = useTimelineLoader(
    `${pubkey}-zaps`,
    readRelays,
    { "#p": [pubkey], kinds: [9735], since: moment().subtract(1, "day").unix() },
    { pageSize: moment.duration(1, "day").asSeconds() }
  );
  const timeline = events.filter(isProfileZap);

  return (
    <Flex direction="column" gap="2" pr="2" pl="2">
      {timeline.map((event) => (
        <ErrorBoundary key={event.id}>
          <ZapNote zapEvent={event} />
        </ErrorBoundary>
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
};

export default UserZapsTab;
