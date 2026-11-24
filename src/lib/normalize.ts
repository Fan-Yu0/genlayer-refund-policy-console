import type { RefundClaim, RefundPolicy } from '../types'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value instanceof Map) return Object.fromEntries(value.entries())
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function numberValue(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function normalizePolicy(raw: unknown): RefundPolicy | null {
  const record = asRecord(raw)
  const policyId = String(record?.policy_id ?? record?.policyId ?? '')
  if (!record || !policyId) return null
  const rules = asRecord(record.rules) || {}
  return {
    publisher: String(record.publisher ?? ''),
    policyId,
    merchant: String(record.merchant ?? ''),
    policyUrl: String(record.policy_url ?? record.policyUrl ?? ''),
    maxDays: numberValue(record.max_days_to_request ?? record.maxDays),
    restockingFeeBps: numberValue(
      record.restocking_fee_bps ?? record.restockingFeeBps,
    ),
    state: numberValue(record.state),
    rules: Object.fromEntries(
      Object.entries(rules).map(([key, value]) => [key, String(value ?? '')]),
    ),
    round: numberValue(record.round),
  }
}

export function normalizeClaim(raw: unknown): RefundClaim | null {
  const record = asRecord(raw)
  const claimId = String(record?.claim_id ?? record?.claimId ?? '')
  if (!record || !claimId) return null
  return {
    claimId,
    policyId: String(record.policy_id ?? record.policyId ?? ''),
    buyer: String(record.buyer ?? ''),
    orderRef: String(record.order_ref ?? record.orderRef ?? ''),
    daysAfterDelivery: numberValue(
      record.days_after_delivery ?? record.daysAfterDelivery,
    ),
    itemOpened: Boolean(record.item_opened ?? record.itemOpened),
    itemDamaged: Boolean(record.item_damaged ?? record.itemDamaged),
    itemUsed: Boolean(record.item_used ?? record.itemUsed),
    state: numberValue(record.state),
    decision: numberValue(record.decision),
    refundBps: numberValue(record.refund_bps ?? record.refundBps),
    reason: String(record.reason ?? ''),
    round: numberValue(record.round),
  }
}

export function normalizeAmount(raw: unknown): string {
  if (typeof raw === 'bigint') return raw.toString()
  const amount = String(raw ?? '0')
  return /^\d+$/.test(amount) ? amount : '0'
}
