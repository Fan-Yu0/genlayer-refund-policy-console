import type { ClaimForm, PolicyForm } from './types'

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  '0xfc261255773e316aBbd32cd474178376BAfdDD1d'
export const GENLAYER_RPC_URL =
  import.meta.env.VITE_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api'
export const EXPLORER_URL = 'https://explorer-studio.genlayer.com'
export const CONTRACT_URL = EXPLORER_URL + '/address/' + CONTRACT_ADDRESS
export const SOURCE_URL =
  'https://github.com/Fan-Yu0/genlayer-refund-policy-console'
export const CONTRACT_SOURCE_URL =
  'https://github.com/Fan-Yu0/refund-policy-adjudicator'
export const SAMPLE_CLAIM_ID = 'ord-2026-114'
export const SAMPLE_POLICY_ID = 'northwind-returns'
export const SAMPLE_POLICY_URL =
  'https://raw.githubusercontent.com/Fan-Yu0/refund-policy-adjudicator/master/examples/refund-policy.md'

export const SAMPLE_POLICY: PolicyForm = {
  policyId: 'northwind-returns-v2',
  merchant: 'Northwind Outfitters',
  policyUrl: SAMPLE_POLICY_URL,
  maxDays: '30',
  restockingFeeBps: '0',
}

export const SAMPLE_CLAIM: ClaimForm = {
  claimId: 'ord-2026-115',
  policyId: SAMPLE_POLICY_ID,
  buyer: 'Dana K.',
  orderRef: 'ORD-2026-115',
  daysAfterDelivery: '8',
  itemOpened: false,
  itemDamaged: false,
  itemUsed: false,
}

export const DECISION_META = {
  0: {
    label: 'Awaiting adjudication',
    shortLabel: 'Draft',
    tone: 'neutral',
    description: 'The claim is registered and ready for a validator-backed decision.',
  },
  1: {
    label: 'Full refund',
    shortLabel: 'Approved',
    tone: 'clear',
    description: 'The request is within the return window and item conditions.',
  },
  2: {
    label: 'Partial refund',
    shortLabel: 'Restocking fee',
    tone: 'review',
    description: 'The return qualifies after the extracted restocking fee.',
  },
  3: {
    label: 'Refund denied',
    shortLabel: 'Denied',
    tone: 'blocked',
    description: 'The request falls outside the agreed policy conditions.',
  },
  4: {
    label: 'Human review required',
    shortLabel: 'Review',
    tone: 'review',
    description: 'The policy is unreadable or contradictory, so no refund is priced.',
  },
} as const

export const RULE_LABELS: Record<string, string> = {
  request_window_days: 'Return window',
  restocking_fee_pct: 'Restocking fee',
  requires_unopened: 'Unopened required',
  accepts_damaged: 'Damaged accepted',
  accepts_used: 'Used accepted',
  final_sale: 'Final-sale items',
}

export function decisionMeta(decision: number, state: number) {
  if (state === 2) return DECISION_META[4]
  return DECISION_META[decision as keyof typeof DECISION_META] || DECISION_META[0]
}
