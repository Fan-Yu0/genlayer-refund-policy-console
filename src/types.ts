export interface PolicyForm {
  policyId: string
  merchant: string
  policyUrl: string
  maxDays: string
  restockingFeeBps: string
}

export interface ClaimForm {
  claimId: string
  policyId: string
  buyer: string
  orderRef: string
  daysAfterDelivery: string
  itemOpened: boolean
  itemDamaged: boolean
  itemUsed: boolean
}

export interface RefundPolicy {
  publisher: string
  policyId: string
  merchant: string
  policyUrl: string
  maxDays: number
  restockingFeeBps: number
  state: number
  rules: Record<string, string>
  round: number
}

export interface RefundClaim {
  claimId: string
  policyId: string
  buyer: string
  orderRef: string
  daysAfterDelivery: number
  itemOpened: boolean
  itemDamaged: boolean
  itemUsed: boolean
  state: number
  decision: number
  refundBps: number
  reason: string
  round: number
}

export type WriteAction = 'register' | 'open' | 'decide' | 'withdraw'
export type TransactionPhase =
  | 'idle'
  | 'preparing'
  | 'signing'
  | 'submitted'
  | 'finalized'
  | 'error'

export interface TransactionState {
  phase: TransactionPhase
  action?: WriteAction
  hash?: string
  message?: string
}

export interface Notice {
  tone: 'success' | 'error' | 'info'
  message: string
}
