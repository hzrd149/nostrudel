import relayStatsService from "../services/relay-stats";
import useSubject from "./use-subject";

export default function useRelayStats(relay: string) {
  const monitorSub = relayStatsService.requestMonitorStats(relay);
  const selfReportedSub = relayStatsService.requestSelfReported(relay);

  const monitor = useSubject(monitorSub);
  const selfReported = useSubject(selfReportedSub);
  const stats = monitor || selfReported || undefined;

  return {
    monitor,
    selfReported,
    stats,
  };
}
