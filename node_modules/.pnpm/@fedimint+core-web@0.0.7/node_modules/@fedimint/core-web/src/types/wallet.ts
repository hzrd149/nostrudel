import { MSats, Duration, JSONValue } from './utils'

const MODULE_KINDS = ['', 'ln', 'mint'] as const
type ModuleKind = (typeof MODULE_KINDS)[number]
type GatewayInfo = {
  gateway_id: string
  api: string
  node_pub_key: string
  federation_index: number
  route_hints: RouteHint[]
  fees: FeeToAmount
}
type LightningGateway = {
  info: GatewayInfo
  vetted: boolean
  ttl: Duration
}

type RouteHint = {
  // TODO: Define the structure of RouteHint
}

type FeeToAmount = {
  // TODO: Define the structure of FeeToAmount
}

type OutgoingLightningPayment = {
  payment_type: PayType
  contract_id: string
  fee: MSats
}

type PayType = {
  type: 'Internal' | 'Lightning'
  operation_id: string
}

type LnPayState =
  | 'created'
  | 'canceled'
  | { funded: { block_height: number } }
  | { waiting_for_refund: { error_reason: string } }
  | 'awaiting_change'
  | { Success: { preimage: string } }
  | { refunded: { gateway_error: string } }
  | { unexpected_error: { error_message: string } }

type LnReceiveState =
  | 'created'
  | { waiting_for_payment: { invoice: string; timeout: number } }
  | { canceled: { reason: string } }
  | 'funded'
  | 'awaiting_funds'
  | 'claimed'

type CreateBolt11Response = {
  operation_id: string
  invoice: string
}

type StreamError = {
  error: string
  data: never
  end: never
}

type StreamSuccess<T extends JSONValue> = {
  data: T
  error: never
  end: never
}

type StreamEnd = {
  end: string
  data: never
  error: never
}

type StreamResult<T extends JSONValue> =
  | StreamSuccess<T>
  | StreamError
  | StreamEnd

type CancelFunction = () => void

type ReissueExternalNotesState =
  | 'Created'
  | 'Issuing'
  | 'Done'
  | { Failed: { error: string } }

type MintSpendNotesResponse = {
  notes: string
  operation_id: string
}

export {
  LightningGateway,
  RouteHint,
  FeeToAmount,
  OutgoingLightningPayment,
  PayType,
  LnPayState,
  LnReceiveState,
  CreateBolt11Response,
  GatewayInfo,
  StreamError,
  StreamSuccess,
  StreamResult,
  ModuleKind,
  CancelFunction,
  ReissueExternalNotesState,
  MintSpendNotesResponse,
}
