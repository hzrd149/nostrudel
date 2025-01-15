import { useObservable } from "applesauce-react/hooks";

import useReport from "../use-report";

export default function useNotificationChannelsReport() {
  const report = useReport("NOTIFICATION_CHANNELS", "notification-channels", {});
  const channels = useObservable(report?.channels);

  return { channels, report };
}
