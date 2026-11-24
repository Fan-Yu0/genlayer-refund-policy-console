import { describe, expect, it } from 'vitest'
import { normalizeAmount, normalizeClaim, normalizePolicy } from './normalize'

const claim = {
  claim_id: 'ord-2026-114', policy_id: 'northwind-returns', buyer: 'Dana K.',
  order_ref: 'ORD-2026-114', days_after_delivery: 8, item_opened: false,
  item_damaged: false, item_used: false, state: 1, decision: 1,
  refund_bps: 10000, reason: 'within policy conditions', round: 1,
}

describe('contract response normalization', () => {
  it('reads live snake_case responses', () => {
    expect(normalizeClaim(claim)).toMatchObject({
      claimId: 'ord-2026-114', policyId: 'northwind-returns', refundBps: 10000,
    })
  })

  it('reads Map responses and normalizes extracted rules', () => {
    const policy = normalizePolicy(new Map(Object.entries({
      policy_id: 'northwind-returns', merchant: 'Northwind Outfitters',
      policy_url: 'https://example.com/returns', max_days_to_request: 30,
      restocking_fee_bps: 0, state: 1, round: 1,
      rules: new Map([['request_window_days', '30 days']]),
    })))
    expect(policy).toMatchObject({ maxDays: 30, rules: { request_window_days: '30 days' } })
  })

  it('rejects missing and malformed records', () => {
    expect(normalizeClaim({})).toBeNull()
    expect(normalizePolicy(null)).toBeNull()
    expect(normalizeClaim('not a record')).toBeNull()
  })

  it('preserves uint64 precision for refund amounts', () => {
    expect(normalizeAmount(900719925474099312345n)).toBe('900719925474099312345')
    expect(normalizeAmount('1000000')).toBe('1000000')
    expect(normalizeAmount(undefined)).toBe('0')
  })
})
