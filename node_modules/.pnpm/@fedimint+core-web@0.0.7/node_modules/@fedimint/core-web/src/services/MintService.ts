import { WorkerClient } from '../worker'
import type {
  Duration,
  JSONObject,
  JSONValue,
  MintSpendNotesResponse,
  MSats,
  ReissueExternalNotesState,
} from '../types'

export class MintService {
  constructor(private client: WorkerClient) {}

  async redeemEcash(notes: string): Promise<void> {
    await this.client.rpcSingle('mint', 'reissue_external_notes', {
      oob_notes: notes, // "out of band notes"
      extra_meta: null,
    })
  }

  async reissueExternalNotes(
    oobNotes: string,
    extraMeta: JSONObject = {},
  ): Promise<string> {
    return await this.client.rpcSingle('mint', 'reissue_external_notes', {
      oob_notes: oobNotes,
      extra_meta: extraMeta,
    })
  }

  subscribeReissueExternalNotes(
    operationId: string,
    onSuccess: (state: JSONValue) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this.client.rpcStream<ReissueExternalNotesState>(
      'mint',
      'subscribe_reissue_external_notes',
      { operation_id: operationId },
      onSuccess,
      onError,
    )

    return unsubscribe
  }

  async spendNotes(
    minAmount: MSats,
    // Tells the wallet to automatically try to cancel the spend if it hasn't completed
    // after the specified number of milliseconds.
    // If the receiver has already redeemed the notes at this time,
    // the notes will not be cancelled
    tryCancelAfter: number | Duration = 0, // in seconds or Duration object
    includeInvite: boolean = false,
    extraMeta: JSONValue = {},
  ): Promise<MintSpendNotesResponse> {
    const duration =
      typeof tryCancelAfter === 'number'
        ? { nanos: 0, secs: tryCancelAfter }
        : tryCancelAfter

    const res = await this.client.rpcSingle<Array<string>>(
      'mint',
      'spend_notes',
      {
        min_amount: minAmount,
        try_cancel_after: duration,
        include_invite: includeInvite,
        extra_meta: extraMeta,
      },
    )
    const notes = res[1]
    const operationId = res[0]

    return {
      notes,
      operation_id: operationId,
    }
  }

  async parseNotes(oobNotes: string): Promise<MSats> {
    return await this.client.rpcSingle('mint', 'validate_notes', {
      oob_notes: oobNotes,
    })
  }

  async tryCancelSpendNotes(operationId: string): Promise<void> {
    await this.client.rpcSingle('mint', 'try_cancel_spend_notes', {
      operation_id: operationId,
    })
  }

  subscribeSpendNotes(
    operationId: string,
    onSuccess: (state: JSONValue) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this.client.rpcStream(
      'mint',
      'subscribe_spend_notes',
      { operation_id: operationId },
      (res) => onSuccess(res),
      onError,
    )

    return unsubscribe
  }

  async awaitSpendOobRefund(operationId: string): Promise<JSONValue> {
    return await this.client.rpcSingle('mint', 'await_spend_oob_refund', {
      operation_id: operationId,
    })
  }
}
