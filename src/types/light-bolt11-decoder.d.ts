declare module "light-bolt11-decoder" {
  // types for https://www.npmjs.com/package/light-bolt11-decoder
  export type LightningNetworkSection = {
    name: "lightning_network";
    letters: string;
  };
  export type CoinNetworkSection = {
    name: "coin_network";
    letters: string;
  };
  export type AmountSection = {
    name: "amount";
    letters: string;
    value: number;
  };
  export type SeparatorSection = {
    name: "separator";
    letters: string;
  };
  export type TimestampSection = {
    name: "timestamp";
    letters: string;
    value: number;
  };
  export type PaymentHashSection = {
    name: "payment_hash";
    tag: "p";
    letters: string;
    value: string;
  };
  export type DescriptionSection = {
    name: "description";
    tag: "d";
    letters: string;
    value: string;
  };
  export type PaymentSecretSection = {
    name: "payment_secret";
    tag: "s";
    letters: string;
    value: string;
  };
  export type ExpirySection = {
    name: "expiry";
    tag: "x";
    letters: string;
    value: number;
  };
  export type MinFinalCltvExpiry = {
    name: "min_final_cltv_expiry";
    tag: "c";
    letters: string;
    value: number;
  };
  export type FeatureBitsSection = {
    name: "feature_bits";
    tag: "9";
    letters: string;
    value: {
      word_length: number;
      option_data_loss_protect: {
        required: boolean;
        supported: boolean;
      };
      initial_routing_sync: {
        required: boolean;
        supported: boolean;
      };
      option_upfront_shutdown_script: {
        required: boolean;
        supported: boolean;
      };
      gossip_queries: {
        required: boolean;
        supported: boolean;
      };
      var_onion_optin: {
        required: boolean;
        supported: boolean;
      };
      gossip_queries_ex: {
        required: boolean;
        supported: boolean;
      };
      option_static_remotekey: {
        required: boolean;
        supported: boolean;
      };
      payment_secret: {
        required: boolean;
        supported: boolean;
      };
      basic_mpp: {
        required: boolean;
        supported: boolean;
      };
      option_support_large_channel: {
        required: boolean;
        supported: boolean;
      };
      extra_bits: {
        start_bit: number;
        bits: number[];
        has_required: boolean;
      };
    };
  };
  export type RouteHintSection = {
    name: "route_hint";
    tag: "r";
    letters: string;
    value: {
      pubkey: string;
      short_channel_id: string;
      fee_base_msat: number;
      fee_proportional_millionths: number;
      cltv_expiry_delta: number;
    }[];
  };
  export type SignatureSection = {
    name: "signature";
    letters: string;
    value: string;
  };
  export type ChecksumSection = {
    name: "checksum";
    letters: string;
  };

  export type Section =
    | LightningNetworkSection
    | CoinNetworkSection
    | AmountSection
    | SeparatorSection
    | TimestampSection
    | PaymentHashSection
    | DescriptionSection
    | PaymentSecretSection
    | ExpirySection
    | FeatureBitsSection
    | RouteHintSection
    | SignatureSection
    | ChecksumSection;

  export type ParsedInvoice = {
    paymentRequest: string;
    sections: Section[];
    expiry: number;
  };
  export function decode(paymentRequest: string): ParsedInvoice;
}
