# K6Projects

This repository is an evolving k6 performance-testing workspace. It currently contains example browser-facing load profiles against Google and an initial DWH ingestion test that models API batch ingestion into a data warehouse gateway.

The project is intentionally lightweight at this stage: tests are plain k6 JavaScript files, dependencies are minimal, and the structure is expected to grow as more systems, scenarios, thresholds, and reporting conventions are added.

## Current scope

- Maintain k6 scripts for load, stress, spike, and soak testing.
- Keep test scenarios grouped by target system under `Tests/`.
- Provide a DWH-focused ingestion test with custom performance metrics.
- Capture practical thresholds in each script so runs can fail when response-time expectations are not met.
- Serve as a foundation for future automation around performance baselines, CI execution, reports, and environment-specific configuration.

## Project structure

```text
K6Projects/
+-- Tests/
|   +-- DWH/
|   |   +-- basicTest.js
|   +-- Google/
|       +-- loadTest.js
|       +-- soakTest.js
|       +-- spikeTest.js
|       +-- stressTest.js
+-- package.json
+-- package-lock.json
+-- README.md
```

## Test coverage

| Test | Purpose | Current target |
| --- | --- | --- |
| `Tests/Google/loadTest.js` | Sustained load profile with ramp-up, steady state, and ramp-down stages. | `https://www.google.com/` |
| `Tests/Google/stressTest.js` | Progressive stress profile that increases virtual users across several plateaus. | `https://www.google.com/` |
| `Tests/Google/spikeTest.js` | Short, sharp traffic spike to observe behavior under sudden high concurrency. | `https://www.google.com/` |
| `Tests/Google/soakTest.js` | Long-duration soak profile intended to expose stability issues over time. | `https://www.google.com/` |
| `Tests/DWH/basicTest.js` | DWH ingestion scenario that posts JSON batches and tracks gateway processing time with a custom `dwh_ingestion_time` Trend metric. | `https://api.dwh-gateway.internal/v1/ingest` |

## Dependencies

Node dependencies are currently limited to development-time type support:

- `@types/k6` - TypeScript/JavaScript editor type definitions for k6 APIs.

k6 itself is not installed through `npm` in this project. Install the k6 runtime separately and make sure the `k6` command is available in your terminal.

```powershell
npm install
k6 version
```

## Running tests

Run an individual script with the k6 CLI:

```powershell
k6 run Tests\Google\loadTest.js
k6 run Tests\Google\stressTest.js
k6 run Tests\Google\spikeTest.js
k6 run Tests\Google\soakTest.js
k6 run Tests\DWH\basicTest.js
```

The DWH test currently points at an internal placeholder-style gateway URL. Update the endpoint, payload, headers, and authentication details before using it against a real environment.

## Notes for contributors

- Keep new tests under `Tests/<SystemName>/`.
- Name scripts after the performance profile or business flow they exercise.
- Add meaningful `thresholds` for each test so results are actionable.
- Prefer environment variables for target URLs, tokens, and environment-specific values as this project matures.
- Treat the current scenarios as a growing baseline rather than a finished performance suite.
