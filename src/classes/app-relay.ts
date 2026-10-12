import { normalizeURL } from "applesauce-core/helpers";
import { Relay, RelayAuthOptions, RelayPool } from "applesauce-relay";
import { BehaviorSubject } from "rxjs";

/** Keep observed auth requirements for UI while v7 owns operation retries and auth waiting. */
export class AppRelay extends Relay {
  readonly authRequiredForRead$ = new BehaviorSubject(false);
  readonly authRequiredForPublish$ = new BehaviorSubject(false);

  constructor(...args: ConstructorParameters<typeof Relay>) {
    super(...args);
    this.connected$.subscribe((connected) => {
      if (!connected) {
        this.authRequiredForRead$.next(false);
        this.authRequiredForPublish$.next(false);
      }
    });
  }

  private authOptions(options?: RelayAuthOptions): RelayAuthOptions {
    return {
      ...options,
      onAuthRequired: (context) => {
        if (context.request.verb === "EVENT") this.authRequiredForPublish$.next(true);
        else this.authRequiredForRead$.next(true);
        return options?.onAuthRequired?.(context);
      },
    };
  }

  override request(...[filters, options]: Parameters<Relay["request"]>) {
    return super.request(filters, this.authOptions(options));
  }

  override subscription(...[filters, options]: Parameters<Relay["subscription"]>) {
    return super.subscription(filters, this.authOptions(options));
  }

  override publish(...[event, options]: Parameters<Relay["publish"]>) {
    return super.publish(event, this.authOptions(options));
  }

  override count(...[filters, id, options]: Parameters<Relay["count"]>) {
    return super.count(filters, id, this.authOptions(options));
  }

  override sync(...[store, filters, direction, options]: Parameters<Relay["sync"]>) {
    return super.sync(store, filters, direction, this.authOptions(options));
  }

  override close() {
    super.close();
    this.authRequiredForRead$.complete();
    this.authRequiredForPublish$.complete();
  }
}

export default class AppRelayPool extends RelayPool {
  override relay(url: string): AppRelay {
    url = normalizeURL(url);
    const existing = this.relays.get(url);
    if (existing) return existing as AppRelay;

    const relay = new AppRelay(url, this.options);
    this.relays.set(url, relay);
    this.relays$.next(this.relays);
    this.add$.next(relay);
    return relay;
  }
}
