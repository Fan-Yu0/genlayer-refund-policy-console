import { describe, expect, it } from 'vitest'
import { SAMPLE_CLAIM, SAMPLE_POLICY } from '../config'
import { hasErrors, validateClaim, validateClaimId, validatePolicy } from './validation'

describe('refund form validation', () => {
  it('accepts contract-compatible policy inputs', () => {
    expect(validatePolicy(SAMPLE_POLICY)).toEqual({})
  })

  it('enforces ID, URL, window and fee constraints', () => {
    const errors = validatePolicy({
      policyId: 'x', merchant: '', policyUrl: 'http://example.com', maxDays: '366',
      restockingFeeBps: '10001',
    })
    expect(Object.keys(errors)).toEqual([
      'policyId', 'merchant', 'policyUrl', 'maxDays', 'restockingFeeBps',
    ])
  })

  it('accepts an unopened buyer claim', () => {
    expect(hasErrors(validateClaim(SAMPLE_CLAIM))).toBe(false)
  })

  it('rejects incomplete claims and non-integer delivery days', () => {
    const errors = validateClaim({
      ...SAMPLE_CLAIM, claimId: '', buyer: '', orderRef: '', daysAfterDelivery: '1.5',
    })
    expect(errors).toMatchObject({
      claimId: 'Claim ID must be 3-64 characters.',
      daysAfterDelivery: 'Days after delivery must be a whole number.',
    })
  })

  it('validates the public read ID separately', () => {
    expect(validateClaimId('ord-2026-114')).toBeUndefined()
    expect(validateClaimId('x')).toBeDefined()
  })
})
