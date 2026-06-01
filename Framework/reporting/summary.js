import { createHtmlReport } from './htmlReporter.js';

function sanitizeReportName(value) {
  return String(value || 'k6-summary')
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/\.js$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'k6-summary';
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

function thresholdFailures(metrics) {
  let failures = 0;

  for (const metric of Object.values(metrics || {})) {
    for (const threshold of Object.values(metric.thresholds || {})) {
      if (!threshold.ok) {
        failures += 1;
      }
    }
  }

  return failures;
}

function createConsoleSummary(data, reportLabel) {
  const metrics = data.metrics || {};
  const checks = metrics.checks?.values || {};
  const httpReqDuration = metrics.http_req_duration?.values || {};
  const httpReqFailed = metrics.http_req_failed?.values || {};
  const httpReqs = metrics.http_reqs?.values || {};
  const iterations = metrics.iterations?.values || {};
  const failedThresholds = thresholdFailures(metrics);

  return [
    '',
    `k6 report: ${reportLabel}`,
    `  checks: ${(checks.passes || 0)} passed, ${(checks.fails || 0)} failed`,
    `  thresholds: ${failedThresholds} failed`,
    `  http_req_duration avg: ${formatDuration(httpReqDuration.avg)}, p95: ${formatDuration(httpReqDuration['p(95)'])}`,
    `  http_req_failed: ${formatNumber((httpReqFailed.rate || 0) * 100)}%`,
    `  http_reqs: ${formatNumber(httpReqs.count || 0, 0)}`,
    `  iterations: ${formatNumber(iterations.count || 0, 0)}`,
    '',
  ].join('\n');
}

function buildSummary(data, defaultReportName) {
  const reportName = sanitizeReportName(__ENV.K6_REPORT_NAME || defaultReportName || 'k6-summary');
  const generatedAt = timestamp();
  const reportLabel = `${generatedAt}-${reportName}`;

  return {
    [`Reports/html/${reportLabel}.html`]: createHtmlReport(data, {
      reportName,
      generatedAt,
    }),
    [`Reports/json/${reportLabel}.json`]: JSON.stringify(data, null, 2),
    [`Reports/json/latest/${reportName}.json`]: JSON.stringify(data, null, 2),
    stdout: createConsoleSummary(data, reportLabel),
  };
}

export function createHandleSummary(defaultReportName) {
  return function handleSummary(data) {
    return buildSummary(data, defaultReportName);
  };
}

export function handleSummary(data) {
  return buildSummary(data, 'k6-summary');
}
