import {
  Button,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";
import relayScoreboardService from "../services/relay-scoreboard";

export function RelayScoreBreakdown({ relay }: { relay: string }) {
  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="link">{relayScoreboardService.getRelayScore(relay)}</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody>
          <Text>
            Avg Connect: {relayScoreboardService.getAverageConnectionTime(relay).toFixed(0)} (
            {relayScoreboardService.getConnectionTimeScore(relay)} pt)
          </Text>
          <Text>
            Avg Response: {relayScoreboardService.getAverageResponseTime(relay).toFixed(0)} (
            {relayScoreboardService.getResponseTimeScore(relay)} pt)
          </Text>
          <Text>
            Avg Eject: {relayScoreboardService.getAverageEjectTime(relay).toFixed(0)} (
            {relayScoreboardService.getEjectTimeScore(relay)} pt)
          </Text>
          {/* <Text>
            Timeouts: {relayScoreboardService.getTimeoutCount(relay).toFixed(0)} (
            {relayScoreboardService.getTimeoutsScore(relay)} pt)
          </Text> */}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
