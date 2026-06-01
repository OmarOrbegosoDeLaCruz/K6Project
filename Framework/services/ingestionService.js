import { check } from 'k6';
import { postIngestionBatch } from '../clients/dwhClient.js';
import { recordDwhProcessingTime } from '../metrics/dwhMetrics.js';

export function ingestBatch(payload) {
  const response = postIngestionBatch(payload);

  check(response, {
    'ingestion accepted (202)': (r) => r.status === 202,
  });

  recordDwhProcessingTime(response);

  return response;
}
