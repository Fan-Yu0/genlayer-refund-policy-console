import type { ClaimForm, PolicyForm } from '../types'

export type PolicyErrors = Partial<Record<keyof PolicyForm, string>>
export type ClaimErrors = Partial<Record<keyof ClaimForm, string>>

function idError(value: string, label: string): string | undefined {
  const id = value.trim()
  if (id.length < 3 || id.length > 64) return `${label} must be 3-64 characters.`
  return undefined
}

function integerError(
  value: string,
  label: string,
  minimum: number,
  maximum: number,
): string | undefined {
  if (!/^\d+$/.test(value.trim())) return `${label} must be a whole number.`
  const number = Number(value)
  if (number < minimum || number > maximum) {
    return `${label} must be ${minimum}-${maximum}.`
  }
  return undefined
}

export function validatePolicy(form: PolicyForm): PolicyErrors {
  const errors: PolicyErrors = {}
  const id = idError(form.policyId, 'Policy ID')
  if (id) errors.policyId = id
  if (form.merchant.trim().length < 2 || form.merchant.trim().length > 120) {
    errors.merchant = 'Merchant must be 2-120 characters.'
  }
  if (!form.policyUrl.trim().startsWith('https://')) {
    errors.policyUrl = 'Use a public HTTPS policy URL.'
  } else if (form.policyUrl.trim().length > 400) {
    errors.policyUrl = 'Policy URL must be 400 characters or fewer.'
  }
  const days = integerError(form.maxDays, 'Fallback return window', 1, 365)
  if (days) errors.maxDays = days
  const fee = integerError(form.restockingFeeBps, 'Fallback fee', 0, 10000)
  if (fee) errors.restockingFeeBps = fee
  return errors
}

export function validateClaim(form: ClaimForm): ClaimErrors {
  const errors: ClaimErrors = {}
  const claim = idError(form.claimId, 'Claim ID')
  if (claim) errors.claimId = claim
  const policy = idError(form.policyId, 'Policy ID')
  if (policy) errors.policyId = policy
  if (form.buyer.trim().length < 2) errors.buyer = 'Buyer name is required.'
  if (!form.orderRef.trim()) errors.orderRef = 'Order reference is required.'
  else if (form.orderRef.trim().length > 64) {
    errors.orderRef = 'Order reference must be 64 characters or fewer.'
  }
  const days = integerError(form.daysAfterDelivery, 'Days after delivery', 0, 100000)
  if (days) errors.daysAfterDelivery = days
  return errors
}

export function validateClaimId(value: string): string | undefined {
  return idError(value, 'Claim ID')
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0
}
