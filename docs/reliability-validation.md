# Reliability validation

## Validated configuration

- Plugin base: `83dc317a45cbd16e88dabd51d50119737a8e1da1` plus this patch.
- Node: 24.22.3.
- Real host: official npm `@deepseek-ai/dsh@0.2.2-rc.1`.
- Official mock provider source: DeepSeek Harness commit `2e39e70496aa02986ca6a820c5d497e816b69d7e`, `packages/test-support/llm-mock-server`.
- Isolated HOME and DSH_HOME, temporary working directory, loopback-only web host and model endpoint, no real provider credentials.
- Plugin installed from its actual `npm pack` tarball using `dsh plugin --profile web add`.
- Normal web token exchange and cookie authentication; actual plugin HTTP routes, AgentLoop, sessions, and shipping DeepSeek adapter. Only the external LLM HTTP/SSE boundary was simulated.
- Plugin work/bid timeout overridden to 3 seconds for bounded fault tests. Mock responses contained text only, no tool calls.

## Observed and asserted results

| Scenario | Final mission status | Observation |
|---|---|---|
| Successful text response | `done` | Expected text delivered |
| Provider `invalid_request` | `failed` | Provider error surfaced, not false success |
| Cancel while provider stalls | `cancelled` | Cancellation surfaced |
| Success after cancellation | `done` | New expected response delivered |
| Provider stall | `failed` | Plugin execution timeout surfaced |
| Empty provider response | `failed` | Host retried empty responses; plugin timeout ultimately surfaced |
| Success after failures | `done` | Expected response delivered |

All seven final statuses were checked against explicit expectations. The mock captured actual provider requests in every scenario. Employee fire returned success after the runs. The host then exited after SIGTERM without a resource-cleanup error in its captured log.

After `dsh plugin --profile web remove dsh-company`, a new real host boot and authenticated request to `/api/dsh-company/state` returned HTTP 404, confirming the plugin route was no longer installed.

Separately, `npm run check` passes JavaScript syntax checks and 47 deterministic unit regressions, including delayed cancellation, concurrent runtime creation, cleanup failure retention, and runtime-before-store shutdown ordering.

## Reproduction outline

1. Install the pinned official host in an isolated directory and obtain the pinned official mock server source.
2. Use a fresh HOME/DSH_HOME and a working directory without `.env` files. Supply only the fake mock key and loopback base URL.
3. Pack this plugin, install the tarball into the `web` profile, and apply a timeout-only test patch.
4. Start the official mock server and `dsh web --host 127.0.0.1 --no-open` in the same network namespace.
5. Exchange the host's launch token for a cookie. Query plugin state, dispatch an explicitly assigned employee, poll the resulting mission, and assert its status/output.
6. Repeat using `success`, `invalid_request`, `stall` with a cancel request, `success`, `stall`, `empty`, and `success`. Reset the mock server between cases.
7. Fire the employee, stop the host, uninstall the plugin, restart, and assert the plugin route returns 404.

## Limits

This is real-host HTTP integration validation, not browser-rendered UI automation and not real-model quality testing. It does not establish compatibility with every Harness version or prove the absence of surviving OS resources. No real model inference was purchased. A hung provider disposal can still delay shutdown; original fire-and-forget storage writes are not globally drained by this patch. Failure-in-disposal paths are covered with controlled unit tests, not forced failures inside the real host.

## Browser UI validation attempt

The plugin was reinstalled for UI testing. Launching the available Chromium with its browser sandbox enabled failed before navigation: the execution environment rejected Chromium's process-singleton socket (`Operation not permitted`). An approved elevated command retry encountered the same restriction. The built-in cloud browser separately returned `ERR_CONNECTION_REFUSED` for the loopback Harness URL; it could not reach the isolated command environment. The environment inventory exposed no other connected computer. No sandbox was disabled and no public tunnel was opened. Consequently, browser UI load, UI form submission, and rendered status assertions remain unverified. Test host processes were stopped after these attempts; the isolated test profile retains the plugin installation for a future UI-capable environment.
