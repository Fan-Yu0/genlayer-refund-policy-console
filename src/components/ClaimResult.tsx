import {
  ArrowUpRight, Check, CheckCircle2, CircleAlert, FileSearch,
  LoaderCircle, PackageCheck, RotateCcw, ShieldQuestion, XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { CONTRACT_SOURCE_URL, RULE_LABELS, decisionMeta } from '../config'
import { readRefundAmount } from '../lib/contract'
import type { RefundClaim, RefundPolicy } from '../types'

interface ClaimResultProps {
  claim: RefundClaim | null
  policy: RefundPolicy | null
  reading: boolean
  canWithdraw: boolean
  busy: boolean
  onWithdraw: () => void
}

function formatMicros(value: string): string {
  const digits = value.padStart(7, '0')
  return `${digits.slice(0, -6) || '0'}.${digits.slice(-6)}`
}

export function ClaimResult({ claim, policy, reading, canWithdraw, busy, onWithdraw }: ClaimResultProps) {
  const [purchaseAmount, setPurchaseAmount] = useState('100.000000')
  const [quoteResult, setQuoteResult] = useState<{ key: string; amount: string } | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [quoteError, setQuoteError] = useState<string>()

  const claimKey = `${claim?.claimId}:${claim?.round}:${claim?.refundBps}`
  const refundAmount = quoteResult?.key === claimKey ? quoteResult.amount : null

  async function quote() {
    if (!claim || !/^\d+(\.\d{0,6})?$/.test(purchaseAmount)) {
      setQuoteError('Enter a non-negative amount with up to 6 decimals.')
      return
    }
    const [whole, fraction = ''] = purchaseAmount.split('.')
    const micros = `${whole}${fraction.padEnd(6, '0')}`.replace(/^0+(?=\d)/, '')
    setQuoting(true)
    setQuoteError(undefined)
    try {
      setQuoteResult({ key: claimKey, amount: await readRefundAmount(claim.claimId, micros) })
    } catch (cause) {
      setQuoteError(cause instanceof Error ? cause.message : 'Could not read the refund quote.')
      setQuoteResult(null)
    } finally {
      setQuoting(false)
    }
  }

  if (reading) {
    return <section className="result-panel loading-state"><LoaderCircle className="spin" size={23} /> Reading the live claim and policy...</section>
  }
  if (!claim) {
    return (
      <section className="result-panel empty-state">
        <span className="empty-icon"><FileSearch size={24} /></span>
        <div><h2>No on-chain claim loaded</h2><p>Load the live sample or enter a claim ID. Public reads never require a wallet.</p></div>
      </section>
    )
  }
  const meta = decisionMeta(claim.decision, claim.state)
  const Icon = claim.state === 2 || claim.decision === 4
    ? ShieldQuestion
    : claim.decision === 1
      ? CheckCircle2
      : claim.decision === 2
        ? PackageCheck
        : claim.decision === 3
          ? XCircle
          : CircleAlert
  return (
    <section className={`result-panel decision-${meta.tone}`}>
      <div className="decision-hero">
        <span className="decision-icon"><Icon size={27} /></span>
        <div className="decision-copy">
          <p className="eyebrow">Validator-backed refund verdict</p>
          <h2>{claim.state === 2 ? 'Claim withdrawn' : meta.label}</h2>
          <p>{claim.reason || meta.description}</p>
        </div>
        <div className="decision-release">
          <span>Refund entitlement</span>
          <strong>{(claim.refundBps / 100).toFixed(2)}%</strong>
          <code>{claim.claimId}</code>
        </div>
      </div>
      <div className="metric-strip">
        <div><span>Order</span><strong className="metric-small">{claim.orderRef}</strong><small>{claim.buyer}</small></div>
        <div><span>Delivery</span><strong>{claim.daysAfterDelivery}</strong><small>days before request</small></div>
        <div><span>Condition</span><strong className="metric-small">{claim.itemDamaged ? 'Damaged' : claim.itemUsed ? 'Used' : claim.itemOpened ? 'Opened' : 'Unopened'}</strong><small>claimant supplied facts</small></div>
        <div><span>Refund</span><strong>{claim.refundBps.toLocaleString()}</strong><small>basis points</small></div>
        <div><span>Decision round</span><strong>{claim.round}</strong><small>{claim.state === 1 ? 'Assessed' : claim.state === 2 ? 'Withdrawn' : 'Draft'}</small></div>
      </div>
      <div className="result-grid">
        <section className="result-section">
          <div className="section-title-row"><h3>Rules extracted by validators</h3><span>{policy?.merchant || 'Policy unavailable'}</span></div>
          {policy && Object.keys(policy.rules).length > 0 ? (
            <dl className="rule-list">
              {Object.entries(RULE_LABELS).map(([key, label]) => (
                <div key={key}><dt>{label}</dt><dd>{policy.rules[key] || 'Not stated'}</dd></div>
              ))}
            </dl>
          ) : <p className="muted-copy">Rules appear after the first completed adjudication.</p>}
          {policy && <div className="result-links"><a href={policy.policyUrl} target="_blank" rel="noreferrer">Merchant policy <ArrowUpRight size={13} /></a><a href={CONTRACT_SOURCE_URL} target="_blank" rel="noreferrer">Contract source <ArrowUpRight size={13} /></a></div>}
        </section>
        <section className="result-section quote-section">
          <div className="section-title-row"><h3>On-chain refund quote</h3><span>Micro units</span></div>
          <label className="quote-label" htmlFor="purchase-amount">Purchase amount</label>
          <div className="quote-controls">
            <input id="purchase-amount" inputMode="decimal" value={purchaseAmount} onChange={(event) => { setPurchaseAmount(event.target.value); setQuoteResult(null) }} />
            <button type="button" className="secondary-button" disabled={quoting} onClick={() => void quote()}>{quoting ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />} Quote</button>
          </div>
          {quoteError && <p className="field-message">{quoteError}</p>}
          {refundAmount !== null && <div className="quote-result"><span>Contract-calculated refund</span><strong>{formatMicros(refundAmount)}</strong><small>Same units as the purchase amount</small></div>}
          {canWithdraw && <button type="button" className="withdraw-button" disabled={busy} onClick={onWithdraw}><RotateCcw size={13} /> Withdraw claim as policy publisher</button>}
        </section>
      </div>
    </section>
  )
}
