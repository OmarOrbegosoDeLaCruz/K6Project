const fs = require('fs');
const path = require('path');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function formatNumber(value, digits = 2) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '-';
  }

  return Number(value).toFixed(digits).replace(/\.?0+$/, '');
}

function formatDuration(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '-';
  }

  if (value >= 1000) {
    return `${formatNumber(value / 1000)}s`;
  }

  return `${formatNumber(value)}ms`;
}

function metricValues(metric) {
  return metric?.values || metric || {};
}

function metricValue(metric, keys, formatter = formatNumber) {
  const values = metricValues(metric);

  for (const key of keys) {
    if (values[key] !== undefined) {
      return formatter(values[key]);
    }
  }

  return '-';
}

function thresholdFailures(metrics) {
  let failures = 0;

  for (const metric of Object.values(metrics || {})) {
    for (const threshold of Object.values(metric.thresholds || {})) {
      if (typeof threshold === 'object' && threshold !== null && threshold.ok === false) {
        failures += 1;
      }
    }
  }

  return failures;
}

function readSummary(summaryPath) {
  return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
}

function summarize(summaryPath) {
  const summary = readSummary(summaryPath);
  const metrics = summary.metrics || {};
  const checks = metricValues(metrics.checks);
  const checkFailures = checks.fails || 0;
  const thresholdFailureCount = thresholdFailures(metrics);
  const failed = checkFailures > 0 || thresholdFailureCount > 0;

  return {
    summary,
    failed,
    checkFailures,
    thresholdFailureCount,
    checksPassed: checks.passes || 0,
    checksTotal: (checks.passes || 0) + checkFailures,
    httpP95: metricValue(metrics.http_req_duration, ['p(95)'], formatDuration),
    httpAvg: metricValue(metrics.http_req_duration, ['avg'], formatDuration),
    httpFailedRate: metricValue(metrics.http_req_failed, ['rate'], (value) => `${formatNumber(value * 100)}%`),
    httpRequestCount: metricValue(metrics.http_reqs, ['count'], (value) => formatNumber(value, 0)),
    iterations: metricValue(metrics.iterations, ['count'], (value) => formatNumber(value, 0)),
  };
}

function displayNameFromPath(summaryPath) {
  return path
    .basename(summaryPath)
    .replace(/(?:-summary)?\.json$/i, '')
    .replace(/^Tests__/, '')
    .replace(/__/g, ' / ')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

function parseArgs(argv) {
  const args = {
    suiteName: 'k6 Suite',
    outputDir: 'Reports/html',
    include: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--suite-name') {
      args.suiteName = argv[++index];
    } else if (arg === '--output-dir') {
      args.outputDir = argv[++index];
    } else if (arg === '--include') {
      args.include.push(argv[++index]);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function createSuiteReport({ suiteName, summaries, generatedAt }) {
  const failedCount = summaries.filter((item) => item.result.failed).length;
  const status = failedCount > 0 ? 'Failed' : 'Passed';
  const totalChecks = summaries.reduce((total, item) => total + item.result.checksTotal, 0);
  const failedChecks = summaries.reduce((total, item) => total + item.result.checkFailures, 0);
  const totalRequests = summaries.reduce((total, item) => {
    const rawCount = metricValues(item.result.summary.metrics?.http_reqs).count || 0;
    return total + rawCount;
  }, 0);

  const rows = summaries
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td><span class="pill ${item.result.failed ? 'fail' : 'pass'}">${item.result.failed ? 'Fail' : 'Pass'}</span></td>
          <td>${escapeHtml(`${item.result.checksPassed} / ${item.result.checksTotal}`)}</td>
          <td>${escapeHtml(String(item.result.checkFailures))}</td>
          <td>${escapeHtml(String(item.result.thresholdFailureCount))}</td>
          <td>${escapeHtml(item.result.httpAvg)}</td>
          <td>${escapeHtml(item.result.httpP95)}</td>
          <td>${escapeHtml(item.result.httpFailedRate)}</td>
          <td>${escapeHtml(item.result.httpRequestCount)}</td>
          <td>${escapeHtml(item.result.iterations)}</td>
        </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(suiteName)} | k6 suite report</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f6f7f9;
      color: #18202c;
    }

    body {
      margin: 0;
      background: #f6f7f9;
    }

    main {
      max-width: 1220px;
      margin: 0 auto;
      padding: 32px 20px 48px;
    }

    header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 1px solid #d7dde7;
    }

    h1, h2 {
      margin: 0;
      letter-spacing: 0;
    }

    h1 {
      font-size: 30px;
      line-height: 1.2;
    }

    h2 {
      font-size: 18px;
      margin: 28px 0 12px;
    }

    .meta {
      margin: 8px 0 0;
      color: #526071;
      font-size: 14px;
    }

    .status {
      border-radius: 8px;
      padding: 10px 14px;
      font-weight: 700;
      background: #e8f6ef;
      color: #176640;
      white-space: nowrap;
    }

    .status.failed {
      background: #fdeceb;
      color: #a52821;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin: 24px 0 8px;
    }

    .card {
      background: #ffffff;
      border: 1px solid #dce2ea;
      border-top: 4px solid #3278b8;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 8px 20px rgba(30, 41, 59, 0.06);
    }

    .card span {
      display: block;
      color: #59677a;
      font-size: 13px;
      margin-bottom: 8px;
    }

    .card strong {
      display: block;
      font-size: 24px;
      line-height: 1.1;
    }

    .table-wrap {
      overflow-x: auto;
      background: #ffffff;
      border: 1px solid #dce2ea;
      border-radius: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 980px;
    }

    th, td {
      text-align: left;
      padding: 12px 14px;
      border-bottom: 1px solid #edf0f4;
      font-size: 13px;
      vertical-align: top;
    }

    th {
      color: #344054;
      background: #f9fafb;
      font-weight: 700;
    }

    tr:last-child td {
      border-bottom: 0;
    }

    .pill {
      display: inline-block;
      border-radius: 999px;
      padding: 4px 9px;
      font-weight: 700;
      font-size: 12px;
    }

    .pill.pass {
      background: #e8f6ef;
      color: #176640;
    }

    .pill.fail {
      background: #fdeceb;
      color: #a52821;
    }

    @media (max-width: 640px) {
      header {
        display: block;
      }

      .status {
        display: inline-block;
        margin-top: 16px;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>${escapeHtml(suiteName)}</h1>
        <p class="meta">Generated at ${escapeHtml(generatedAt)}</p>
      </div>
      <div class="status ${status === 'Failed' ? 'failed' : ''}">${status}</div>
    </header>

    <section class="cards">
      <article class="card">
        <span>Profiles</span>
        <strong>${summaries.length}</strong>
      </article>
      <article class="card">
        <span>Failed profiles</span>
        <strong>${failedCount}</strong>
      </article>
      <article class="card">
        <span>Checks</span>
        <strong>${totalChecks - failedChecks} / ${totalChecks}</strong>
      </article>
      <article class="card">
        <span>HTTP requests</span>
        <strong>${formatNumber(totalRequests, 0)}</strong>
      </article>
    </section>

    <section>
      <h2>Profile Results</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Profile</th>
              <th>Status</th>
              <th>Checks</th>
              <th>Check failures</th>
              <th>Threshold failures</th>
              <th>HTTP avg</th>
              <th>HTTP p95</th>
              <th>HTTP failed</th>
              <th>HTTP requests</th>
              <th>Iterations</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="10">No summaries were included.</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  </main>
</body>
</html>`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.include.length === 0) {
    throw new Error('At least one --include summary path is required.');
  }

  const summaries = args.include
    .filter((summaryPath) => fs.existsSync(summaryPath))
    .map((summaryPath) => ({
      name: displayNameFromPath(summaryPath),
      path: summaryPath,
      result: summarize(summaryPath),
    }));

  fs.mkdirSync(args.outputDir, { recursive: true });

  const generatedAt = timestamp();
  const suiteSlug = args.suiteName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const fileName = `${generatedAt}-${suiteSlug}.html`;
  const outputPath = path.join(args.outputDir, fileName);
  const html = createSuiteReport({
    suiteName: args.suiteName,
    summaries,
    generatedAt,
  });

  fs.writeFileSync(outputPath, html);
  console.log(`Suite report written to ${outputPath}`);
}

if (require.main === module) {
  main();
}
