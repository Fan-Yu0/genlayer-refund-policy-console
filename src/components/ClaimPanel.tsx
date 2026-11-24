import { PackageOpen, Search, Scale } from 'lucide-react'
import type { ClaimForm } from '../types'
import type { ClaimErrors } from '../lib/validation'
import { Field } from './Field'

interface ClaimPanelProps {
  form: ClaimForm
  errors: ClaimErrors
  busy: boolean
  connected: boolean
  inspectId: string
  inspectError?: string
  onChange: (field: keyof ClaimForm, value: string | boolean) => void
  onInspectChange: (value: string) => void
  onRead: () => void
  onDecide: () => void
  onSubmit: () => void
  onSample: () => void
}

export function ClaimPanel({
  form, errors, busy, connected, inspectId, inspectError,
  onChange, onInspectChange, onRead, onDecide, onSubmit, onSample,
}: ClaimPanelProps) {
  return (
    <section className="tool-panel claim-panel">
      <div className="panel-heading">
        <span className="panel-icon secondary"><PackageOpen size={20} /></span>
        <div><h2>Open & decide a claim</h2><p>Buyer facts in, deterministic verdict out.</p></div>
        <button type="button" className="text-button" onClick={onSample}>Live sample</button>
      </div>
      <div className="form-stack">
        <div className="form-grid">
          <Field label="Claim ID" error={errors.claimId}>
            <input value={form.claimId} onChange={(event) => onChange('claimId', event.target.value)} />
          </Field>
          <Field label="Policy ID" error={errors.policyId}>
            <input value={form.policyId} onChange={(event) => onChange('policyId', event.target.value)} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Buyer" error={errors.buyer}>
            <input value={form.buyer} onChange={(event) => onChange('buyer', event.target.value)} />
          </Field>
          <Field label="Order reference" error={errors.orderRef}>
            <input value={form.orderRef} onChange={(event) => onChange('orderRef', event.target.value)} />
          </Field>
        </div>
        <Field label="Days after delivery" error={errors.daysAfterDelivery}>
          <input type="number" min="0" value={form.daysAfterDelivery} onChange={(event) => onChange('daysAfterDelivery', event.target.value)} />
        </Field>
        <div className="condition-grid" aria-label="Item condition">
          {([
            ['itemOpened', 'Opened'],
            ['itemDamaged', 'Damaged'],
            ['itemUsed', 'Used'],
          ] as const).map(([key, label]) => (
            <label className="condition-item" key={key}>
              <input type="checkbox" checked={form[key]} onChange={(event) => onChange(key, event.target.checked)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
      <button type="button" className="primary-button full-width" disabled={busy || !connected} onClick={onSubmit}>
        {connected ? 'Open claim on GenLayer' : 'Connect wallet to open claim'}
      </button>
      <div className="inspect-divider"><span>Inspect or adjudicate</span></div>
      <Field label="Existing claim ID" error={inspectError}>
        <input value={inspectId} onChange={(event) => onInspectChange(event.target.value)} />
      </Field>
      <div className="screen-actions">
        <button type="button" className="secondary-button" disabled={busy} onClick={onRead}><Search size={15} /> Read claim</button>
        <button type="button" className="secondary-button" disabled={busy || !connected} onClick={onDecide}><Scale size={15} /> Run adjudication</button>
      </div>
    </section>
  )
}
