import { useObservable } from "applesauce-react/hooks";

import useReport from "../use-report";

export default function useServicesReport() {
  const report = useReport("SERVICES", `services`, {});

  return useObservable(report?.services);
}
