import { WorkerClient } from '../worker'

export const TESTING_INVITE =
  'fed11qgqrsdnhwden5te0v9cxjtt4dekxzamxw4kz6mmjvvkhydted9ukg6r9xfsnx7th0fhn26tf093juamwv4u8gtnpwpcz7qqpyz0e327ua8geceutfrcaezwt22mk6s2rdy09kg72jrcmncng2gn0kp2m5sk'

// This is a testing service that allows for inspecting the internals
// of the WorkerClient. It is not intended for use in production.
export class TestingService {
  public TESTING_INVITE: string
  constructor(private client: WorkerClient) {
    // Solo Mint on mutinynet
    this.TESTING_INVITE = TESTING_INVITE
  }

  getRequestCounter() {
    return this.client._getRequestCounter()
  }

  getRequestCallbackMap() {
    return this.client._getRequestCallbackMap()
  }

  async payWithFaucet(invoice: string) {
    try {
      const response = await fetch(
        `https://faucet.mutinynet.com/api/lnurlw/callback?k1=k1&pr=${invoice}`,
      )

      if (!response.ok) {
        throw new Error(
          `HTTP error! Failed to pay invoice. status: ${response.status}`,
        )
      }

      return await response.json()
    } catch (error) {
      console.error('Error paying with faucet', error)
      throw error
    }
  }

  async getExternalInvoice(amount: number) {
    try {
      const response = await fetch(
        `https://lnurl-staging.mutinywallet.com/lnurlp/refund/callback?amount=${amount}`,
      )
      if (!response.ok) {
        throw new Error(
          `HTTP error! Failed to get external invoice. status: ${response.status}`,
        )
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting external invoice', error)
      throw error
    }
  }
}
