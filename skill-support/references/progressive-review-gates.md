# Progressive HTML Review Gates

> Compatibility entry: use `references/workflows/fast-preview.md` for the early checkpoint and `references/workflows/release-validation.md` after explicit direction approval. The rules below remain for older task contracts.

Use these gates for every workflow that produces an HTML, React, or Vue page.
The first visible page is a user-review artifact, not a final delivery. Do not
hide it behind release-level validation.

## Gate A: Visible Preview

Reach this gate as soon as the agreed primary view and interactions can be
reviewed in a browser.

Before showing the preview, run only the blocking minimum:

- the PC framework layout contract passes;
- component source decisions are recorded and real available components are
  imported;
- the page builds or opens without a fatal error;
- the primary view renders at the target desktop viewport;
- the main navigation and primary task are operable enough for review.

Then provide the clickable path or URL, open the exact artifact when browser
control is available, and pause. Invite the user to inspect layout, hierarchy,
copy, components, spacing, colors, states, and interactions through browser
comments. Do not start Pixso work, exhaustive state testing, complete Token or
icon audits, accessibility sweeps, delivery stamping, mirroring, or release
packaging until the user explicitly approves the direction.

## Gate B: User Review Loop

Treat each browser comment as feedback on the visible preview. Apply the
requested changes, refresh the same review URL when possible, run the minimum
preview checks again, and return to Gate A. Repeat until the user explicitly
says the direction is approved or asks to proceed to strict validation.

## Gate C: Release Validation

After explicit approval, run the complete checks required by the selected
workflow and delivery scope, including applicable component reuse, contract,
Token, icon, interaction, accessibility, responsive desktop, browser-console,
artifact provenance, Pixso, mirror, and packaging checks. Fix failures without
silently changing the approved design direction.

## Gate D: Final Review

Open the validated final artifact at the target viewport and let the user see
the result again. Report the checks performed and any remaining limitations.
Final completion requires both release validation and this visible final
checkpoint.
