# Pixso delivery

`pixso/` contains the currently maintained Unified Agent, Page Binding Bridge,
component registry sync, Token sync and Token probe plugin packages. Each
plugin has its own `manifest.json`; install its folder in Pixso. The Unified
Agent is the principal native rendering plugin.

For HTML-to-Pixso work, first generate and inspect the HTML page at the target
viewport. The Pixso handoff must preserve Pattern structure, mapped component
identity, semantic icon aliases, and Token names. Read back the created Pixso
nodes and variables after import; capture alone is not proof of linkage.

The exported plugins are versioned snapshots of the full source. For plugin
code changes, edit the source repository and regenerate this distribution.
