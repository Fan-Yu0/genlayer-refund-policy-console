import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { ExecutionResult, TransactionStatus } from 'genlayer-js/types'
import type { CalldataEncodable } from 'genlayer-js/types'
import { CONTRACT_ADDRESS, EXPLORER_URL, GENLAYER_RPC_URL } from '../config'
import type {
  ClaimForm,
  PolicyForm,
  TransactionPhase,
  WriteAction,
} from '../types'
import { normalizeAmount, normalizeClaim, normalizePolicy } from './normalize'
import {
  executionErrorMessage,
  resolveExecutionResult,
  type ReceiptLike,
} from './receipt'

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

const readClient = createClient({ chain: studionet, endpoint: GENLAYER_RPC_URL })

function getProvider(): EthereumProvider {
  if (!window.ethereum) {
    throw new Error('No browser wallet found. Install an EIP-1193 wallet to write.')
  }
  return window.ethereum
}

export function normalizeWalletError(cause: unknown): Error {
  if (cause instanceof Error) return cause
  const detail = cause as
    | { code?: number; message?: string; data?: { message?: string } }
    | undefined
  if (detail?.code === 4001) return new Error('You rejected the wallet request.')
  if (detail?.code === -32002) {
    return new Error('A wallet request is already pending. Open your wallet to continue.')
  }
  return new Error(detail?.data?.message || detail?.message || 'The wallet request failed.')
}

export async function connectWallet(): Promise<string> {
  try {
    const accounts = (await getProvider().request({ method: 'eth_requestAccounts' })) as string[]
    if (!accounts[0]) throw new Error('The wallet did not return an account.')
    return accounts[0]
  } catch (cause) {
    throw normalizeWalletError(cause)
  }
}

export async function getConnectedAccounts(): Promise<string[]> {
  if (!window.ethereum) return []
  try {
    return (await window.ethereum.request({ method: 'eth_accounts' })) as string[]
  } catch {
    return []
  }
}

const STUDIONET_CHAIN_ID = `0x${studionet.id.toString(16)}`

async function switchToStudioNet(provider: EthereumProvider): Promise<void> {
  const current = (await provider
    .request({ method: 'eth_chainId' })
    .catch(() => undefined)) as string | undefined
  if (current?.toLowerCase() === STUDIONET_CHAIN_ID) return
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIONET_CHAIN_ID }],
    })
    return
  } catch (cause) {
    const error = cause as { code?: number; message?: string }
    if (error?.code === 4001) throw normalizeWalletError(cause)
    const message = String(error?.message ?? '').toLowerCase()
    if (
      error?.code !== 4902 &&
      !message.includes('unrecognized') &&
      !message.includes('not added') &&
      !message.includes('unknown chain')
    ) throw normalizeWalletError(cause)
  }
  try {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: STUDIONET_CHAIN_ID,
        chainName: studionet.name,
        rpcUrls: [GENLAYER_RPC_URL],
        nativeCurrency: studionet.nativeCurrency,
        blockExplorerUrls: [EXPLORER_URL],
      }],
    })
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIONET_CHAIN_ID }],
    })
  } catch (cause) {
    throw normalizeWalletError(cause)
  }
}

export async function ensureSigningReady(): Promise<void> {
  await switchToStudioNet(getProvider())
}

export async function readClaim(claimId: string) {
  const result = await readClient.readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName: 'get_claim',
    args: [claimId.trim().toLowerCase()],
  })
  return normalizeClaim(result)
}

export async function readPolicy(policyId: string) {
  const result = await readClient.readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName: 'get_policy',
    args: [policyId.trim().toLowerCase()],
  })
  return normalizePolicy(result)
}

export async function readRefundAmount(claimId: string, purchaseMicros: string) {
  const result = await readClient.readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName: 'refund_amount',
    args: [claimId.trim().toLowerCase(), BigInt(purchaseMicros)],
  })
  return normalizeAmount(result)
}

async function submitTransaction(
  account: string,
  _action: WriteAction,
  functionName: string,
  args: CalldataEncodable[],
  onPhase: (phase: TransactionPhase, message: string, hash?: string) => void,
) {
  onPhase('preparing', 'Preparing StudioNet transaction.', undefined)
  await ensureSigningReady()
  const client = createClient({
    chain: studionet,
    endpoint: GENLAYER_RPC_URL,
    account: account as `0x${string}`,
    provider: getProvider() as never,
  })
  onPhase('signing', 'Confirm the transaction in your wallet.')
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName,
    args,
    value: 0n,
  }).catch((cause: unknown) => {
    throw normalizeWalletError(cause)
  })
  onPhase('submitted', 'Transaction submitted. Waiting for validator consensus.', hash)
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 120,
    interval: 3000,
  })
  const receiptLike = receipt as unknown as ReceiptLike
  const resultName = resolveExecutionResult(receiptLike)
  if (resultName === ExecutionResult.FINISHED_WITH_ERROR) {
    const detail = executionErrorMessage(receiptLike)
    throw new Error(detail ? `Contract execution failed: ${detail}` : 'Contract execution failed.')
  }
  if (resultName === 'TIMEOUT') throw new Error('The GenLayer transaction timed out.')
  if (resultName === 'NONDET_DISAGREE') {
    throw new Error('Validators could not agree on the policy evidence.')
  }
  if (resultName !== ExecutionResult.FINISHED_WITH_RETURN) {
    throw new Error(resultName ? `Unexpected execution result: ${resultName}` : 'No execution result returned.')
  }
  onPhase('finalized', 'Finalized on GenLayer StudioNet.', hash)
  return hash
}

type PhaseHandler = (phase: TransactionPhase, message: string, hash?: string) => void

export function registerPolicy(account: string, form: PolicyForm, onPhase: PhaseHandler) {
  return submitTransaction(account, 'register', 'register_policy', [
    form.policyId.trim().toLowerCase(), form.merchant.trim(), form.policyUrl.trim(),
    Number(form.maxDays), Number(form.restockingFeeBps),
  ], onPhase)
}

export function openClaim(account: string, form: ClaimForm, onPhase: PhaseHandler) {
  return submitTransaction(account, 'open', 'open_claim', [
    form.claimId.trim().toLowerCase(), form.policyId.trim().toLowerCase(),
    form.buyer.trim(), form.orderRef.trim(), Number(form.daysAfterDelivery),
    form.itemOpened, form.itemDamaged, form.itemUsed,
  ], onPhase)
}

export function decideClaim(account: string, claimId: string, onPhase: PhaseHandler) {
  return submitTransaction(account, 'decide', 'decide', [claimId.trim().toLowerCase()], onPhase)
}

export function withdrawClaim(account: string, claimId: string, onPhase: PhaseHandler) {
  return submitTransaction(account, 'withdraw', 'withdraw_claim', [claimId.trim().toLowerCase()], onPhase)
}

export function transactionUrl(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`
}
