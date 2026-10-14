# Text-to-UI · HTML compact edition

An installable HarmonyOS PC Skill with real HTML components, shared Tokens,
Pattern Runtime and maintained Pixso plugin snapshots. Start with `SKILL.md`.

```bash
node scripts/scaffold-project.mjs --project /absolute/path/to/my-page
node scripts/generate-page.mjs --project /absolute/path/to/my-page --spec examples/page-spec.json
cd /absolute/path/to/my-page
pnpm install
pnpm dev
```

The project is self-contained after scaffolding. Its vendored packages are
copied from this repository. `PROVENANCE.json` records the full source branch
and commit. Regenerate this edition from the full source with
`node tools/export-compact-html.mjs --out <empty-directory>`; do not hand-edit
generated component code or plugin snapshots here.
