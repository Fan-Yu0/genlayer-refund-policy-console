import {
  BookOpenCheck, CheckCircle2, ExternalLink, FileCheck2, GitBranch,
  Info, Scale, ShieldCheck, WalletCards, X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Header } from './components/Header'
import { PolicyPanel } from './components/PolicyPanel'
import { ClaimPanel } from './components/ClaimPanel'
import { ClaimResult } from './components/ClaimResult'
import { TransactionBanner } from './components/TransactionBanner'
import {
  CONTRACT_SOURCE_URL, CONTRACT_URL, SAMPLE_CLAIM, SAMPLE_CLAIM_ID,
  SAMPLE_POLICY, SOURCE_URL,
} from './config'
import { useWallet } from './hooks/useWallet'
import {
  decideClaim, openClaim, readClaim, readPolicy, registerPolicy, withdrawClaim,
} from './lib/contract'
import {
  hasErrors, validateClaim, validateClaimId, validatePolicy,
  type ClaimErrors, type PolicyErrors,
} from './lib/validation'
import type {
  ClaimForm, Notice, PolicyForm, RefundClaim, RefundPolicy, TransactionState,
} from './types'
import './App.css'

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback
}

function App() {
  const wallet = useWallet()
  const [policyForm, setPolicyForm] = useState<PolicyForm>(SAMPLE_POLICY)
  const [policyErrors, setPolicyErrors] = useState<PolicyErrors>({})
  const [claimForm, setClaimForm] = useState<ClaimForm>(SAMPLE_CLAIM)
  const [claimErrors, setClaimErrors] = useState<ClaimErrors>({})
  const [inspectId, setInspectId] = useState(SAMPLE_CLAIM_ID)
  const [inspectError, setInspectError] = useState<string>()
  const [claim, setClaim] = useState<RefundClaim | null>(null)
  const [policy, setPolicy] = useState<RefundPolicy | null>(null)
  const [reading, setReading] = useState(true)
  const [transaction, setTransaction] = useState<TransactionState>({ phase: 'idle' })
  const [notice, setNotice] = useState<Notice | null>(null)
  const busy = ['preparing', 'signing', 'submitted'].includes(transaction.phase)

  const loadRecord = useCallback(async (claimId: string, announce = true) => {
    const error = validateClaimId(claimId)
    if (error) { setInspectError(error); return }
    setInspectError(undefined)
    setReading(true)
    if (announce) setNotice(null)
    try {
      const nextClaim = await readClaim(claimId)
      setClaim(nextClaim)
      setPolicy(nextClaim ? await readPolicy(nextClaim.policyId) : null)
      if (!nextClaim && announce) setNotice({ tone: 'info', message: 'No claim with this ID was found.' })
    } catch (cause) {
      setNotice({ tone: 'error', message: errorMessage(cause, 'Could not read the contract.') })
    } finally {
      setReading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => void loadRecord(SAMPLE_CLAIM_ID, false), 0)
    return () => clearTimeout(timer)
  }, [loadRecord])

  function updatePolicy(field: keyof PolicyForm, value: string) {
    setPolicyForm((current) => ({ ...current, [field]: value }))
    setPolicyErrors((current) => ({ ...current, [field]: undefined }))
  }
  function updateClaim(field: keyof ClaimForm, value: string | boolean) {
    setClaimForm((current) => ({ ...current, [field]: value }))
    setClaimErrors((current) => ({ ...current, [field]: undefined }))
  }
  function phaseHandler(action: TransactionState['action']) {
    return (phase: TransactionState['phase'], message: string, hash?: string) => {
      setTransaction({ phase, action, message, hash })
    }
  }
  function requireWallet(): boolean {
    if (wallet.address) return true
    setNotice({ tone: 'error', message: 'Connect a wallet before submitting a transaction.' })
    return false
  }

  async function handleRegister() {
    const errors = validatePolicy(policyForm)
    setPolicyErrors(errors)
    if (hasErrors(errors) || !requireWallet()) return
    setNotice(null)
    try {
      await registerPolicy(wallet.address!, policyForm, phaseHandler('register'))
      setClaimForm((current) => ({ ...current, policyId: policyForm.policyId.trim().toLowerCase() }))
      setNotice({ tone: 'success', message: 'Policy registered. You can now open a claim against it.' })
      setPolicy(await readPolicy(policyForm.policyId))
    } catch (cause) {
      setTransaction({ phase: 'error', action: 'register', message: errorMessage(cause, 'Policy registration failed.') })
    }
  }
  async function handleOpenClaim() {
    const errors = validateClaim(claimForm)
    setClaimErrors(errors)
    if (hasErrors(errors) || !requireWallet()) return
    setNotice(null)
    try {
      await openClaim(wallet.address!, claimForm, phaseHandler('open'))
      const claimId = claimForm.claimId.trim().toLowerCase()
      setInspectId(claimId)
      setNotice({ tone: 'success', message: 'Claim opened. Run adjudication when you are ready.' })
      await loadRecord(claimId, false)
    } catch (cause) {
      setTransaction({ phase: 'error', action: 'open', message: errorMessage(cause, 'Opening the claim failed.') })
    }
  }
  async function handleDecide() {
    const error = validateClaimId(inspectId)
    setInspectError(error)
    if (error || !requireWallet()) return
    setNotice(null)
    try {
      await decideClaim(wallet.address!, inspectId, phaseHandler('decide'))
      setNotice({ tone: 'success', message: 'Adjudication finalized with a fresh on-chain verdict.' })
      await loadRecord(inspectId, false)
    } catch (cause) {
      setTransaction({ phase: 'error', action: 'decide', message: errorMessage(cause, 'Adjudication failed.') })
    }
  }
  async function handleWithdraw() {
    if (!claim || !requireWallet()) return
    setNotice(null)
    try {
      await withdrawClaim(wallet.address!, claim.claimId, phaseHandler('withdraw'))
      setNotice({ tone: 'success', message: 'Claim withdrawn by the policy publisher.' })
      await loadRecord(claim.claimId, false)
    } catch (cause) {
      setTransaction({ phase: 'error', action: 'withdraw', message: errorMessage(cause, 'Withdrawal failed.') })
    }
  }

  return (
    <div className="app-shell">
      <Header address={wallet.address} connecting={wallet.connecting} hasProvider={wallet.hasProvider} onConnect={wallet.connect} onDisconnect={wallet.disconnect} />
      {notice && <div className={`notice notice-${notice.tone}`} role="status">
        {notice.tone === 'success' ? <CheckCircle2 size={17} /> : <Info size={17} />}<span>{notice.message}</span>
        <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><X size={15} /></button>
      </div>}
      <main className="main-content">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Evidence-backed commerce operations</p>
            <h1>Refund Policy Console</h1>
            <p>Register a merchant's public return terms, open a buyer claim, and let GenLayer validators turn policy language into a deterministic refund.</p>
          </div>
          <div className="heading-meta"><span><ShieldCheck size={16} /> Validator-read policies</span><span><Scale size={16} /> Deterministic refunds</span></div>
        </section>
        <TransactionBanner state={transaction} />
        <div className="workbench-grid">
          <PolicyPanel form={policyForm} errors={policyErrors} busy={busy} connected={Boolean(wallet.address)} onChange={updatePolicy} onReset={() => { setPolicyForm(SAMPLE_POLICY); setPolicyErrors({}) }} onSubmit={() => void handleRegister()} />
          <ClaimPanel form={claimForm} errors={claimErrors} busy={busy} connected={Boolean(wallet.address)} inspectId={inspectId} inspectError={inspectError} onChange={updateClaim} onInspectChange={(value) => { setInspectId(value); setInspectError(undefined) }} onRead={() => void loadRecord(inspectId)} onDecide={() => void handleDecide()} onSubmit={() => void handleOpenClaim()} onSample={() => { setInspectId(SAMPLE_CLAIM_ID); setClaimForm(SAMPLE_CLAIM); void loadRecord(SAMPLE_CLAIM_ID) }} />
        </div>
        <ClaimResult claim={claim} policy={policy} reading={reading} busy={busy} canWithdraw={Boolean(wallet.address && policy && wallet.address.toLowerCase() === policy.publisher.toLowerCase() && claim?.state !== 2)} onWithdraw={() => void handleWithdraw()} />
        <section className="reference-band">
          <div className="reference-intro"><p className="eyebrow">Policy to payout</p><h2>One source of truth. Four clear outcomes.</h2><p>Validators read the merchant's policy and agree on constrained rules. Contract code, not an LLM, applies the return window, item condition, and restocking fee.</p></div>
          <div className="policy-list">
            <div><span className="policy-dot clear" /><div><strong>Full refund</strong><p>Within the return window and eligible condition.</p></div></div>
            <div><span className="policy-dot review" /><div><strong>Partial refund</strong><p>Eligible return minus the verified restocking fee.</p></div></div>
            <div><span className="policy-dot blocked" /><div><strong>Denied or review</strong><p>Excluded claims denied; unclear evidence never priced.</p></div></div>
          </div>
          <div className="reference-links">
            <a href={SOURCE_URL} target="_blank" rel="noreferrer"><GitBranch size={16} /> Console source</a>
            <a href={CONTRACT_SOURCE_URL} target="_blank" rel="noreferrer"><BookOpenCheck size={16} /> Contract & tests</a>
            <a href={CONTRACT_URL} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Deployed contract</a>
          </div>
        </section>
      </main>
      <footer className="app-footer"><span><FileCheck2 size={13} /> Refund Policy Console</span><span><WalletCards size={13} /> Public reads · wallet-signed writes · gasless StudioNet</span></footer>
    </div>
  )
}

export default App
