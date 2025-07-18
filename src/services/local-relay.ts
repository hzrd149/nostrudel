import { Relay } from "applesauce-relay";
import { catchError, firstValueFrom, map, of } from "rxjs";
import { LOCAL_RELAY_URL } from "../const";

export async function checkLocalRelay() {
  return firstValueFrom(
    new Relay(LOCAL_RELAY_URL).request({ limit: 1 }).pipe(
      map(() => true),
      catchError(() => of(false)),
    ),
  );
}
