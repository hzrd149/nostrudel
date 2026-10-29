import { catchError, EMPTY, MonoTypeOperatorFunction } from "rxjs";

import { logger } from "./debug";

const log = logger.extend("RelayAcquisition");

/** End a best-effort read without discarding events already received. Apply inside switchMap so later inputs still work. */
export default function ignoreRelayErrors<T>(context: string): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => {
    log(context, error);
    return EMPTY;
  });
}
