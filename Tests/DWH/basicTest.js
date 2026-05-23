import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Custom metric to track how long the DWH takes to process the ingested batch
const DwhIngestionTime = new Trend('dwh_ingestion_time');

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up to 50 concurrent data streams
    { duration: '5m', target: 50 },  // Stay at peak load to test DWH ingestion stability
    { duration: '1m', target: 0 },   // Scale down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% of ingestion requests must be under 1.5s
    dwh_ingestion_time: ['p(99)<3000'], // Track deep-dive DWH batch processing threshold
  },
};

export default function () {
  const payload = JSON.stringify({
    batch_id: `batch_${__VU}_${__ITER}`,
    timestamp: new Date().toISOString(),
    data: [ { record_id: 1, metric: 42.5 }, { record_id: 2, metric: 88.1 } ]
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  // Simulating high-velocity API ingestion into the staging layer
  const res = http.post('https://api.dwh-gateway.internal/v1/ingest', payload, params);

  check(res, {
    'ingestion accepted (202)': (r) => r.status === 202,
  });

  // Optional: Capture custom headers returned by the gateway tracking internal DWH execution time
  if (res.headers['X-DWH-Process-Time']) {
    DwhIngestionTime.add(parseFloat(res.headers['X-DWH-Process-Time']));
  }

  sleep(1);
}