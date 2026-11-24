# Portal submission draft

## Category

Builder -> Projects

## Contribution date

2026-11-24

## Title

Refund Policy Console

## One-line summary

Evidence-backed merchant refund console with wallet-signed policy registration, claims, and live GenLayer adjudication.

## Description

Refund Policy Console is a complete GenLayer application for consumer returns. Merchants register a public refund policy and fallback rules; buyers open a claim with their order reference, delivery age, and item condition. Anyone can trigger adjudication. Validators independently fetch the merchant's policy and agree on constrained rules, then deterministic contract code returns FULL_REFUND, PARTIAL_REFUND, DENIED, or REVIEW_REQUIRED. The console handles wallet connection, StudioNet switching, transaction finalization, execution-result checks, and fresh public reads. It exposes the extracted policy rules, the reason for the verdict, and a live refund_amount quote for any purchase amount. The policy publisher can withdraw claims. It ships a responsive interface, source, tests, documentation, and GitHub Pages deployment.

## Usage step 1

Open the live console and inspect the sample without connecting a wallet.

## Expected verification result

The sample `ord-2026-114` loads as FULL_REFUND with 10000 basis points, 8 days after delivery, and the Northwind return rules. A refund quote for 100.000000 returns 100.000000. A reviewer can connect any EIP-1193 wallet, register a unique policy, open a unique claim, and run a new finalized adjudication on gasless StudioNet.

## Links

- Website: https://Fan-Yu0.github.io/genlayer-refund-policy-console/
- Repository: https://github.com/Fan-Yu0/genlayer-refund-policy-console
- Contract: https://explorer-studio.genlayer.com/address/0xfc261255773e316aBbd32cd474178376BAfdDD1d
- Underlying contract: https://github.com/Fan-Yu0/refund-policy-adjudicator
- Required evidence: https://github.com/Fan-Yu0/genlayer-refund-policy-console
