# Refund Policy Console

A complete GenLayer application for evidence-backed merchant refund adjudication.
The console registers public return policies, opens buyer claims, runs validator-backed
decisions, inspects the extracted rules, and reads the contract's refund quote.

**Live app:** https://Fan-Yu0.github.io/genlayer-refund-policy-console/

## Contract

- StudioNet contract: [`0xfc261255773e316aBbd32cd474178376BAfdDD1d`](https://explorer-studio.genlayer.com/address/0xfc261255773e316aBbd32cd474178376BAfdDD1d)
- Contract source and direct-mode tests: [refund-policy-adjudicator](https://github.com/Fan-Yu0/refund-policy-adjudicator)
- Live sample: `ord-2026-114`, a full refund against `northwind-returns`.

## Use it

Public reads work without a wallet. To write, connect an EIP-1193 wallet; the app adds
or switches to gasless GenLayer StudioNet (chain ID 61999).

1. Register a unique policy ID, the merchant name, an HTTPS policy page, and fallback rules.
2. Open a unique claim ID against that policy with the buyer's order facts.
3. Enter the claim ID under **Inspect or adjudicate** and select **Run adjudication**.
4. Validators independently read the policy and agree on constrained rules. The contract
   then calculates a full refund, partial refund, denial, or human-review outcome.
5. Enter a purchase amount in the result panel to call `refund_amount` on-chain. The
   publisher of the policy can also withdraw its claims from this interface.

The default policy form uses a new ID to avoid colliding with the already-deployed sample.
The **Live sample** button always loads the existing finalized `ord-2026-114` claim.

## Development

```sh
npm ci
npm run check
npm run dev
```

Optional environment overrides are documented in `.env.example`. The default StudioNet
contract and RPC are suitable for public use. To publish GitHub Pages:

```sh
npm run deploy
```

## Implementation notes

- React, TypeScript, Vite, `genlayer-js`, and Lucide icons; no backend or custody service.
- Maps contract responses defensively and keeps uint64 refund quotes as strings/bigints.
- Verifies GenLayer execution receipts rather than treating a submitted hash as success.
- External policy text is evidence, not instructions. Unclear or contradictory policy
  evidence fails closed to human review. This app does not itself move customer funds.
