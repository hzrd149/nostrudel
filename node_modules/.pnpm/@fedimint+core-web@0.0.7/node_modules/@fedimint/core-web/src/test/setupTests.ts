import { expect, test } from 'vitest'
import { TestFedimintWallet } from './TestFedimintWallet'

/**
 * Adds Fixtures for setting up and tearing down a test FedimintWallet instance
 */
export const walletTest = test.extend<{ wallet: TestFedimintWallet }>({
  wallet: async ({}, use) => {
    const randomTestingId = Math.random().toString(36).substring(2, 15)
    const wallet = new TestFedimintWallet()
    expect(wallet).toBeDefined()

    await expect(
      wallet.joinFederation(wallet.testing.TESTING_INVITE, randomTestingId),
    ).resolves.toBeUndefined()
    await use(wallet)

    // clear up browser resources
    await wallet.cleanup()
    // remove the wallet db
    indexedDB.deleteDatabase(randomTestingId)
  },
})

/**
 * Adds Fixtures for setting up and tearing down a test Worker instance
 */
export const workerTest = test.extend<{
  worker: Worker
  clientName: string
}>({
  worker: async ({}, use) => {
    const worker = new Worker(new URL('../worker/worker.js', import.meta.url), {
      type: 'module',
    })
    await use(worker)
    worker.terminate()
  },
  clientName: async ({}, use) => {
    const randomTestingId = Math.random().toString(36).substring(2, 15)
    await use(randomTestingId)
  },
})
