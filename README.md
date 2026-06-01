# K6Projects

This repository is an evolving k6 performance-testing workspace. The DWH ingestion scenarios use a layered framework that separates test descriptions, business flows, domain services, API clients, payload data, metrics, and environment configuration. The Google tests remain as simple standalone examples.

The project is intentionally lightweight at this stage: tests are plain k6 JavaScript files, dependencies are minimal, and the structure is expected to grow as more systems, scenarios, thresholds, and reporting conventions are added.

## Current scope

- Maintain k6 scripts for load, stress, spike, and soak testing.
- Keep test entrypoints grouped by target system under `Tests/`.
- Keep reusable DWH ingestion behavior under `Framework/`.
- Provide DWH-focused ingestion tests with custom performance metrics.
- Capture practical thresholds centrally so runs can fail when response-time expectations are not met.
- Generate timestamped k6 HTML and JSON execution reports for local and CI runs.
- Serve as a foundation for future automation around performance baselines, CI execution, reports, and environment-specific configuration.

## Project structure

```text
K6Projects/
+-- Framework/
|   +-- clients/
|   |   +-- dwhClient.js
|   +-- services/
|   |   +-- ingestionService.js
|   +-- flows/
|   |   +-- ingestionFlow.js
|   +-- data/
|   |   +-- payloadBuilder.js
|   +-- metrics/
|   |   +-- dwhMetrics.js
|   +-- reporting/
|   |   +-- htmlReporter.js
|   |   +-- suiteReport.js
|   |   +-- summary.js
|   +-- config/
|       +-- environments.js
|       +-- thresholds.js
+-- Tests/
|   +-- DWH/
|       +-- ingestion.load.js
|       +-- ingestion.stress.js
|       +-- ingestion.soak.js
|   +-- Google/
|       +-- loadTest.js
|       +-- soakTest.js
|       +-- spikeTest.js
|       +-- stressTest.js
+-- Reports/
|   +-- html/
|   +-- json/
+-- package.json
+-- package-lock.json
+-- README.md
```

## Layer responsibilities

- `Tests/` describes what is happening for a specific performance profile.
- `Framework/flows/` describes the business process.
- `Framework/services/` describes the domain action.
- `Framework/clients/` describes the API call.
- `Framework/data/` builds request payloads.
- `Framework/metrics/` owns custom k6 metrics.
- `Framework/reporting/` owns reusable k6 end-of-test summary reporting.
- `Framework/config/` owns environment and threshold configuration.

## Test coverage

| Test | Purpose | Current target |
| --- | --- | --- |
| `Tests/DWH/ingestion.load.js` | Sustained DWH ingestion profile with ramp-up, steady state, and ramp-down stages. | `https://api.dwh-gateway.internal/v1/ingest` |
| `Tests/DWH/ingestion.stress.js` | Progressive DWH ingestion profile that increases virtual users across several plateaus. | `https://api.dwh-gateway.internal/v1/ingest` |
| `Tests/DWH/ingestion.soak.js` | Long-duration DWH ingestion profile intended to expose stability issues over time. | `https://api.dwh-gateway.internal/v1/ingest` |
| `Tests/Google/loadTest.js` | Sustained example load profile with ramp-up, steady state, and ramp-down stages. | `https://www.google.com/` |
| `Tests/Google/stressTest.js` | Progressive example stress profile that increases virtual users across several plateaus. | `https://www.google.com/` |
| `Tests/Google/spikeTest.js` | Short, sharp example traffic spike to observe behavior under sudden high concurrency. | `https://www.google.com/` |
| `Tests/Google/soakTest.js` | Long-duration example soak profile intended to expose stability issues over time. | `https://www.google.com/` |

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
k6 run Tests\DWH\ingestion.load.js
k6 run Tests\DWH\ingestion.stress.js
k6 run Tests\DWH\ingestion.soak.js
k6 run Tests\Google\loadTest.js
k6 run Tests\Google\stressTest.js
k6 run Tests\Google\spikeTest.js
k6 run Tests\Google\soakTest.js
```

Each k6 entrypoint exports a `handleSummary()` function from the shared reporter factory in `Framework/reporting/summary.js`. Every completed run writes timestamped reports to:

- `Reports/html/<timestamp>-<test-name>.html`
- `Reports/json/<timestamp>-<test-name>.json`

The same summary is also written to `Reports/json/latest/<test-name>.json` so suite-level reports can aggregate the current run without relying on timestamp discovery.

The HTML report is a local, vendored reporter implementation, so k6 does not need to import reporter code from a remote URL at runtime.

The DWH tests currently point at an internal placeholder-style gateway URL. Set `DWH_INGESTION_URL` before using them against a real environment:

```powershell
$env:DWH_INGESTION_URL = "https://your-dwh-gateway.example/v1/ingest"
k6 run Tests\DWH\ingestion.load.js
```

## GitHub Actions CI

The repository includes a production-oriented GitHub Actions workflow at `.github/workflows/k6-ci.yml`.

The workflow runs automatically when relevant project files change in:

- Pull requests targeting any branch.
- Pushes to `main`, including changes after a pull request is merged.

It can also be started manually from the GitHub Actions tab with `workflow_dispatch`. Manual runs use GitHub's branch selector, so choose the branch first, then start the workflow.

CI installs dependencies, installs k6, and runs every current k6 entrypoint with a minimal execution profile:

```bash
K6_REPORT_NAME=<artifact-safe-test-name> k6 run --vus 1 --iterations 1 <script>
```

This means CI executes the test code and sends real requests, but it does not run the full load, stress, spike, or soak profile defined in each script. That keeps pull request feedback practical while still catching broken imports, runtime errors, failed checks, failing thresholds, and target connectivity problems. k6 handles threshold failures through its own exit code; after each run, CI also reads the exported k6 summary and fails the job if any `check()` assertion failed.

CI currently runs these scripts:

- `Tests/DWH/ingestion.load.js`
- `Tests/DWH/ingestion.stress.js`
- `Tests/DWH/ingestion.soak.js`
- `Tests/Google/loadTest.js`
- `Tests/Google/stressTest.js`
- `Tests/Google/spikeTest.js`
- `Tests/Google/soakTest.js`

For DWH CI runs, configure a repository secret named `DWH_INGESTION_URL`. The workflow passes that value to k6 so the DWH tests target a real environment instead of the placeholder URL. If the secret is missing, CI still runs the Google scripts and emits a warning that the DWH scripts were skipped.

CI uses `actions/checkout` for pull request, push, and manual runs, installs Node.js 20, runs `npm ci`, and installs the k6 runtime on the hosted runner.

The workflow uploads debugging artifacts for each run:

- `k6-test-results-<run_id>` contains one `.log` file and one exported k6 `summary.json` file per executed script.
- The same artifact also contains timestamped HTML reports from `Reports/html/`.
- The same artifact also contains timestamped JSON reports from `Reports/json/`.
- The same artifact also contains a grouped Google suite report named `<timestamp>-google-k6-suite.html`.

The Google tests still run as separate k6 profiles in CI. After those four scripts complete, `Framework/reporting/suiteReport.js` reads the matching `Reports/json/latest/` summaries and creates one suite-level HTML report. CI continues through all configured tests, generates reports, and then fails at the end if any script had failed checks, threshold failures, or a non-zero k6 exit code.

## Notes for contributors

- Keep new tests under `Tests/<SystemName>/`.
- Name scripts after the business flow and performance profile they exercise.
- Keep business logic out of test entrypoints; put it in flows, services, clients, data builders, metrics, or config.
- Add meaningful thresholds in `Framework/config/thresholds.js` so results are actionable.
- Prefer environment variables for target URLs, tokens, and environment-specific values as this project matures.
- Treat the current scenarios as a growing baseline rather than a finished performance suite.
