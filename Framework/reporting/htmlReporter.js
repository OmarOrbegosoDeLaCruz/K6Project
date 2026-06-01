function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function metricValue(metric, keys, formatter = formatNumber) {
  for (const key of keys) {
    if (metric.values?.[key] !== undefined) {
      return formatter(metric.values[key]);
    }
  }

  return '-';
}

function thresholdRows(metrics) {
  const rows = [];

  for (const [metricName, metric] of Object.entries(metrics || {})) {
    for (const [expression, threshold] of Object.entries(metric.thresholds || {})) {
      rows.push({
        metricName,
        expression,
        ok: threshold.ok,
      });
    }
  }

  return rows;
}

function metricRows(metrics) {
  return Object.entries(metrics || {})
    .filter(([, metric]) => metric.values)
    .sort(([left], [right]) => left.localeCompare(right));
}

function summaryCards(data) {
  const metrics = data.metrics || {};
  const checks = metrics.checks;
  const httpReqDuration = metrics.http_req_duration;
  const httpReqs = metrics.http_reqs;
  const failedReqs = metrics.http_req_failed;
  const iterations = metrics.iterations;

  return [
    {
      label: 'Checks passed',
      value: checks
        ? `${formatNumber(checks.values?.passes || 0, 0)} / ${formatNumber((checks.values?.passes || 0) + (checks.values?.fails || 0), 0)}`
        : '-',
      status: checks && checks.values?.fails > 0 ? 'bad' : 'good',
    },
    {
      label: 'HTTP p95',
      value: metricValue(httpReqDuration || {}, ['p(95)'], formatDuration),
      status: 'neutral',
    },
    {
      label: 'HTTP requests',
      value: metricValue(httpReqs || {}, ['count'], (value) => formatNumber(value, 0)),
      status: 'neutral',
    },
    {
      label: 'Failed requests',
      value: metricValue(failedReqs || {}, ['rate'], (value) => `${formatNumber(value * 100)}%`),
      status: failedReqs && failedReqs.values?.rate > 0 ? 'bad' : 'good',
    },
    {
      label: 'Iterations',
      value: metricValue(iterations || {}, ['count'], (value) => formatNumber(value, 0)),
      status: 'neutral',
    },
  ];
}

export function createHtmlReport(data, options = {}) {
  const title = options.reportName || 'k6 summary';
  const generatedAt = options.generatedAt || new Date().toISOString();
  const thresholds = thresholdRows(data.metrics);
  const failedThresholds = thresholds.filter((threshold) => !threshold.ok).length;
  const checks = data.metrics?.checks?.values || {};
  const checkFailures = checks.fails || 0;
  const status = failedThresholds > 0 || checkFailures > 0 ? 'Failed' : 'Passed';

  const cards = summaryCards(data)
    .map(
      (card) => `
        <article class="card ${card.status}">
          <span>${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
        </article>`
    )
    .join('');

  const thresholdTable = thresholds.length
    ? thresholds
        .map(
          (threshold) => `
            <tr>
              <td>${escapeHtml(threshold.metricName)}</td>
              <td><code>${escapeHtml(threshold.expression)}</code></td>
              <td><span class="pill ${threshold.ok ? 'pass' : 'fail'}">${threshold.ok ? 'Pass' : 'Fail'}</span></td>
            </tr>`
        )
        .join('')
    : '<tr><td colspan="3">No thresholds were configured for this run.</td></tr>';

  const metricsTable = metricRows(data.metrics)
    .map(
      ([name, metric]) => `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(metric.type || '-')}</td>
          <td>${metricValue(metric, ['count', 'value'], (value) => formatNumber(value, 0))}</td>
          <td>${metricValue(metric, ['rate'], (value) => formatNumber(value))}</td>
          <td>${metricValue(metric, ['avg'], formatDuration)}</td>
          <td>${metricValue(metric, ['p(90)'], formatDuration)}</td>
          <td>${metricValue(metric, ['p(95)'], formatDuration)}</td>
          <td>${metricValue(metric, ['max'], formatDuration)}</td>
        </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | k6 report</title>
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
      max-width: 1180px;
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

    .card.good {
      border-top: 4px solid #2d9d66;
    }

    .card.bad {
      border-top: 4px solid #d6453d;
    }

    .card.neutral {
      border-top: 4px solid #3278b8;
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
      min-width: 720px;
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

    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      color: #24364b;
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
        <h1>${escapeHtml(title)}</h1>
        <p class="meta">Generated at ${escapeHtml(generatedAt)}</p>
      </div>
      <div class="status ${status === 'Failed' ? 'failed' : ''}">${status}</div>
    </header>

    <section class="cards">
      ${cards}
    </section>

    <section>
      <h2>Thresholds</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Expression</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${thresholdTable}</tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Metrics</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Type</th>
              <th>Count / Value</th>
              <th>Rate</th>
              <th>Avg</th>
              <th>P90</th>
              <th>P95</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>${metricsTable}</tbody>
        </table>
      </div>
    </section>
  </main>
</body>
</html>`;
}
