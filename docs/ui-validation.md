# Architecture and workflow UI validation

## Changes

- Architecture overview with real workspace counts and navigation to the two existing execution paths. All new strings have Chinese and English translations.
- Workflow monitor with latest-run status, settled-node progress, textual state counts and keyboard-selectable nodes and edges.
- Decorative SVG particles only when the overall run is running, an upstream node is done, a downstream node is running, and the draft's execution identity matches the immutable graph captured by the host at dispatch. Historical runs without this snapshot have no canvas status overlay. Workflow names, node titles/instructions, employee assignments and incoming edge order form execution identity; changes to layout coordinates alone do not invalidate it.
- Node `running` means **executing or waiting for the employee lock**, not guaranteed active model inference. The UI explicitly says so. Animation never represents tokens or actual network traffic.
- A motion checkbox and `prefers-reduced-motion` support. Narrow panels stack the inspector beneath the scrollable graph; graph coordinates remain intact.

## Verification

`node --check client.js`, `node --check index.js`, and `node --test test/client-ui.test.js` pass. Eight deterministic tests cover particle gating, topology mismatch/legacy runs, pending-employee wording, progress values, keyboard affordances, architecture routes/counts, dictionary parity, reduced-motion CSS and responsive rules.

Tests evaluate the actual component source with lightweight React hook stubs; they are **not** browser rendering or live-host interaction tests.

Static HTML fixtures were generated from the actual component trees and CSS for English/Chinese wide and narrow panels outside the repository. Cloud-browser navigation to the local fixture was rejected because its URL policy only allows HTTP(S). No security setting was changed. Browser-rendered visual validation, responsive overflow measurements, animated playback, and interactive live-host integration therefore remain unverified. The prior sandboxed Chromium launch limitation has not been worked around.

## Integration

The UI branch is based on `83dc317`. Its changes have been applied without conflict to the reliability working tree. It changes `client.js`, adds this document and `test/client-ui.test.js`, and records/exposes the run graph in `index.js`. Keep the reliability branch's scripts/tests. Run its combined `npm run check` after integration. No dependencies or public services were added.

## Integrated real-host checks

The combined working tree passes 55 tests (47 reliability + 8 UI-source tests). In the real official Harness 0.2.2-rc.1 web profile with the official local mock provider, a workflow completed successfully and returned a graph snapshot containing its name, nodes and ordered edges. Saving a changed workflow name/title/instruction retained the original run snapshot. After restarting with a controlled legacy fixture lacking `lastRun.graph`, the real host returned `graph: null` while preserving completed status and outputs. This confirms HTTP and persisted-data compatibility, not browser rendering.

## Superseding Mac verification for v0.6.0

The cloud-browser limitations above are historical. The connected Mac's real installed host was subsequently tested in Chrome with the official local mock provider. See [Mac UI validation](mac-ui-validation.md) for bilingual real screenshots, particle gating, keyboard checks, tool-safety/ownership/budget checks and explicit limitations. Current suite: 66 tests. Node array order also remains part of graph execution identity because it can affect shared-employee scheduling.
