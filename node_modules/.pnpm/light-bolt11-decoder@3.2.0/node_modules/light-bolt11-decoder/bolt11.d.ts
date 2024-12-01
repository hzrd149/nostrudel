declare module "light-bolt11-decoder" {
  type NetworkSection = {
    name: 'coin_network';
    letters: string;
    value?: {
      bech32: string;
      pubKeyHash: number;
      scriptHash: number;
      validWitnessVersions: number[];
    };
  };

  type FeatureBits = {
    option_data_loss_protect: string;
    initial_routing_sync: string;
    option_upfront_shutdown_script: string;
    gossip_queries: string;
    var_onion_optin: string;
    gossip_queries_ex: string;
    option_static_remotekey: string;
    payment_secret: string;
    basic_mpp: string;
    option_support_large_channel: string;
    extra_bits: {
      start_bit: number;
      bits: unknown[];
      has_required: boolean;
    };
  };

  type RouteHint = {
    pubkey: string;
    short_channel_id: string;
    fee_base_msat: number;
    fee_proportional_millionths: number;
    cltv_expiry_delta: number;
  };

  type RouteHintSection = {
    name: "route_hint";
    tag: "r";
    letters: string;
    value: RouteHint[];
  };

  type FeatureBitsSection = {
    name: "feature_bits";
    tag: "9";
    letters: string;
    value: FeatureBits;
  };

  type Section =
    | { name: "paymentRequest"; value: string }
    | { name: "expiry"; value: number }
    | { name: "checksum"; letters: string }
    | NetworkSection
    | { name: "amount"; letters: string; value: string }
    | { name: "separator"; letters: string }
    | { name: "timestamp"; letters: string; value: number }
    | { name: "payment_hash"; tag: "p"; letters: string; value: string }
    | { name: "description"; tag: "d"; letters: string; value: string }
    | { name: "payment_secret"; tag: "s"; letters: string; value: string }
    | {
        name: "min_final_cltv_expiry";
        tag: "c";
        letters: string;
        value: number;
      }
    | FeatureBitsSection
    | RouteHintSection
    | { name: "signature"; letters: string; value: string };

  type PaymentJSON = {
    paymentRequest: string;
    sections: Section[];
    expiry: number;
    route_hints: RouteHint[][];
  };

  type DecodedInvoice = {
    paymentRequest: string;
    sections: Section[];
    expiry: number;
    route_hints: RouteHint[][];
  };

  function decode(invoice: string): DecodedInvoice;
}
