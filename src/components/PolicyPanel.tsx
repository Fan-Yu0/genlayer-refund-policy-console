import { FileText, RotateCcw } from 'lucide-react'
import type { PolicyForm } from '../types'
import type { PolicyErrors } from '../lib/validation'
import { Field } from './Field'

interface PolicyPanelProps {
  form: PolicyForm
  errors: PolicyErrors
  busy: boolean
  connected: boolean
  onChange: (field: keyof PolicyForm, value: string) => void
  onReset: () => void
  onSubmit: () => void
}

export function PolicyPanel({
  form, errors, busy, connected, onChange, onReset, onSubmit,
}: PolicyPanelProps) {
  return (
    <section className="tool-panel">
      <div className="panel-heading">
        <span className="panel-icon"><FileText size={20} /></span>
        <div><h2>Register a return policy</h2><p>Anchor the merchant's public terms.</p></div>
        <button type="button" className="text-button" onClick={onReset}><RotateCcw size={13} /> Reset</button>
      </div>
      <div className="form-stack">
        <div className="form-grid">
          <Field label="Policy ID" error={errors.policyId}>
            <input value={form.policyId} onChange={(event) => onChange('policyId', event.target.value)} placeholder="merchant-returns" />
          </Field>
          <Field label="Merchant" error={errors.merchant}>
            <input value={form.merchant} onChange={(event) => onChange('merchant', event.target.value)} />
          </Field>
        </div>
        <Field label="Public policy URL" hint="HTTPS" error={errors.policyUrl}>
          <input type="url" value={form.policyUrl} onChange={(event) => onChange('policyUrl', event.target.value)} />
        </Field>
        <div className="form-grid">
          <Field label="Fallback window" hint="Days" error={errors.maxDays}>
            <input type="number" min="1" max="365" value={form.maxDays} onChange={(event) => onChange('maxDays', event.target.value)} />
          </Field>
          <Field label="Fallback restocking fee" hint="Basis points" error={errors.restockingFeeBps}>
            <input type="number" min="0" max="10000" value={form.restockingFeeBps} onChange={(event) => onChange('restockingFeeBps', event.target.value)} />
          </Field>
        </div>
      </div>
      <button type="button" className="primary-button full-width" disabled={busy || !connected} onClick={onSubmit}>
        {connected ? 'Register policy on GenLayer' : 'Connect wallet to register'}
      </button>
      <p className="panel-footnote">Fallbacks apply only when the source does not state a clear rule. Validators independently re-read the policy.</p>
    </section>
  )
}
