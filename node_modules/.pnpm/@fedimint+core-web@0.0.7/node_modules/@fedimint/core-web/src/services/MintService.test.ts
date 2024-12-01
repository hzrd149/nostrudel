import { expect } from 'vitest'
import { walletTest } from '../test/setupTests'

walletTest('redeemEcash should error on invalid ecash', async ({ wallet }) => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  await expect(wallet.mint.redeemEcash('test')).rejects.toThrow()
})

walletTest(
  'reissueExternalNotes should throw if wallet is empty',
  async ({ wallet }) => {
    expect(wallet).toBeDefined()
    expect(wallet.isOpen()).toBe(true)

    await expect(wallet.mint.reissueExternalNotes('test')).rejects.toThrow()
  },
)

walletTest('spendNotes should throw if wallet is empty', async ({ wallet }) => {
  expect(wallet).toBeDefined()
  expect(wallet.isOpen()).toBe(true)

  await expect(wallet.mint.spendNotes(100)).rejects.toThrow()
})
