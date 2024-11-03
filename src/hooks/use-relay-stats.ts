import { useObservable } from "applesauce-react/hooks";
import relayStatsService from "../services/relay-stats";

export default function useRelayStats(relay: string) {
  const monitorSub = relayStatsService.requestMonitorStats(relay);
  const selfReportedSub = relayStatsService.requestSelfReported(relay);

  const monitor = useObservable(monitorSub);
  const selfReported = useObservable(selfReportedSub);
  const stats = monitor || selfReported || undefined;

  return {
    monitor,
    selfReported,
    stats,
  };
}
