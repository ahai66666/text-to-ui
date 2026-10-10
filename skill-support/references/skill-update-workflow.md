# Skill Update Release Workflow

Use this workflow whenever changing this Skill, especially shared tokens, components, patterns, or previews. Treat the canonical repository as the only editing source; installed and test-folder copies are release mirrors.

## 1. Classify the change

- Documentation-only: update the owning rule/reference and validate the Skill.
- Token change: update CSS/JSON tokens, the human rule, every affected component/pattern, and its gallery example.
- Component change: update component markup/styles/states, component documentation, and `preview/component-gallery.html`.
- Pattern/layout change: update the pattern implementation, layout rules/tokens, component gallery pattern, and any dedicated test page.
- Never use a dedicated test page as a substitute for the component gallery. It is additional evidence only.

## 2. Edit the canonical Skill only

Apply the complete change set under the canonical Skill folder first. Do not edit the installed mirror or portable test copy independently. Confirm the HTML uses the real reusable component variant rather than a visually similar local class.

## 3. Refresh dependency fingerprints

Run:

```bash
python3 scripts/update_preview_cache.py --write
python3 scripts/update_preview_cache.py --check
```

The script fingerprints local CSS and JavaScript dependencies by content. It updates CSS `@import` versions and preview HTML `href`/`src` versions, so a changed asset cannot keep an old cache key.

## 4. Validate before synchronization

- Run the shipped validation entry points on the canonical Skill. This
  repository does not include `quick_validate.py`; do not reference an
  unavailable validator in the release checklist. At minimum run
  `node scripts/test-validate-page-contract.mjs`, parse changed JSON, and run
  the applicable Token, component, page-spec, and dual-output checks below.
- For Token changes, run `node scripts/build-pixso-token-manifest.mjs --write`, then `node scripts/build-token-runtime-map.mjs`, then `node scripts/build-dual-output-token-map.mjs --write`; run all three again in `--check` mode where supported. The runtime map must be regenerated before the dual-output map.
- Treat `assets/design-system/pixso-variables.json`, `assets/design-system/token-runtime-map.json`, and `assets/design-system/dual-output-token-map.json` as one generated chain. Never hand-edit them or accept a release in which their Pixso variable sets differ.
- Validate the canonical page contract with `node scripts/validate-page-spec.mjs <page-spec.json>`.
- Validate the page constraint/provenance contract with
  `node scripts/validate-page-contract.mjs --page-spec <page-spec.json>` and
  include a negative test that rejects a forbidden output or stale artifact.
- Validate every delivered HTML/Pixso pair with `node scripts/validate-dual-output.mjs --page-spec <page-spec.json> --html <file.html> --pixso-audit <pixso-binding-audit.json>`. A visual match is not a substitute for this gate.
- Include a negative validator test when changing a guardrail. The validator must reject at least one intentional hardcoded color or metric before the change is accepted.
- Parse every changed JSON file.
- Syntax-check changed inline or external JavaScript.
- Confirm preview-local CSS/JavaScript references exist.
- Search for the superseded rule so stale wording or old selectors do not remain.

## 5. Synchronize and prove parity

Sync the complete changed file set from canonical to the installed Skill mirror. Sync portable test pages only after canonical verification. Compare every synchronized file byte-for-byte (`cmp` or hashes); do not assume a copy succeeded.

## 6. Verify the user-visible preview

Open `preview/component-gallery.html` after synchronization. For shared UI changes, completion requires all of the following:

1. Confirm the page loaded the new fingerprinted stylesheet/script URL.
2. Inspect the visible component or pattern in a screenshot, not only source code.
3. Read computed styles and geometry for the changed property.
4. Exercise affected states and interactions, including collapsed/expanded or hover/pressed when relevant.
5. If the user is viewing another file path or copy, open or refresh that exact final path and repeat the key check.

Do not report completion from a local-server test alone when the user is opening a `file://` copy, or from a dedicated test page when the requested surface is the component gallery.

## Release gate

Report a Skill update as complete only when canonical files, cache fingerprints, installed mirror, component gallery, and the user's final preview path all agree. The page spec must name the exact source Token → Web CSS variable → Pixso Variable mapping; the HTML must consume the CSS variables; the Pixso audit must prove live Variable bindings and linked component instances; and both hardcoded-color and hardcoded-metric checks must pass. Include the verified values or state in the handoff.
