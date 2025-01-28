import { PropsWithChildren } from "react";
import { useObservable } from "applesauce-react/hooks";
import { FactoryProvider } from "applesauce-react/providers";

import factory$ from "../../services/event-factory";

export default function EventFactoryProvider({ children }: PropsWithChildren) {
  const factory = useObservable(factory$);

  return <FactoryProvider factory={factory}>{children}</FactoryProvider>;
}
