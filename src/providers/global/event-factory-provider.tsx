import { PropsWithChildren } from "react";
import { useObservable } from "applesauce-react/hooks";
import { FactoryProvider } from "applesauce-react/providers";

import eventFactoryService from "../../services/event-factory";

export default function EventFactoryProvider({ children }: PropsWithChildren) {
  const factory = useObservable(eventFactoryService.subject);

  return <FactoryProvider factory={factory ?? undefined}>{children}</FactoryProvider>;
}
