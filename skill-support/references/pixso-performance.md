# Pixso Performance and Failure Budget

The Pixso plugin or MCP fallback is a design-editing stage, not a reason to block
the HTML checkpoint. Keep the operation set small, grouped, and observable.

## Package gate before Pixso

For diagnostic code-to-design only, select one fidelity channel before importing and run
`scripts/validate-pixso-import-package.mjs` against the exact ZIP entry that
will be submitted. This cheap local check catches the most expensive failures
before a slow `code_to_design` call: wrong/duplicate HTML entry, missing local
CSS, path traversal, runtime-only empty regions, stale state markers, missing
strict semantic markers, and authored hardcoded colors. Fast mode may pass with
no binding markers and reports that limitation. Strict mode requires binding
markers and variable-color source usage, then still requires Pixso live read-back
for every Component instance and Color Variable.

## Bounded paths

- In fast visual import, do not run the strict registered-reuse planner before
  the first Pixso write. Prepare the inline-SVG copy and import the complete
  browser-checked HTML once; optionally run a non-strict planner after the
  Frame exists to identify safe linked replacements.
- In strict structured reuse, run the registered-reuse planner before any
  Pixso write. If the plan has registered regions, import only a low-complexity
  Pattern skeleton and page-owned content. Do not import the complete HTML
  composition as a second component renderer.
- Normal structured import must not call `code_to_design`. A separate diagnostic
  run may call it at most once; the result is temporary evidence, never the
  canonical Frame.
- Group discovery reads (`fetch_context`, page list, variables, styles,
  components, and top-level frames) before writes. Do not repeat full-document
  discovery after every local edit.
- Batch related `apply_design` operations (no more than 50 operations per
  call), then query only the affected nodes. Avoid repeated whole-frame
  `query_all_unique_props` and screenshots.
- Take one screenshot after the initial visual import or skeleton/instance pass
  and one final screenshot after targeted fixes. A failed or timed-out call
  gets one bounded retry; after that, preserve the HTML draft and report the
  Pixso limitation.

## Required telemetry

Record `pixsoCallCount`, `slowestCallMs`, `codeToDesignCalls`, `codeToDesignMs`,
`canonicalNodeCount`, `operationCount`, module timings, `retryCount`, and `abortedByBudget` in the Pixso
audit. A large imported frame, serial per-node reads, repeated binding retries,
or multiple failed calls must be reported as the performance cause rather than
described as a generic slow connection.

## Stop conditions

Stop the fast visual path when the target file is not active or the icon crop
audit fails. Stop strict component resolution or repair when the target file is
not active, the NewComponents library phase is not focused, or the
registered-reuse plan is not strict-ready. Once source components are verified,
the target product page may be any page in the same file. Return the verified
HTML draft and the exact next action instead of spending more calls on a
blocked frame.
