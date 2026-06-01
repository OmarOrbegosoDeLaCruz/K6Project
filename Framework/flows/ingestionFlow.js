import { sleep } from 'k6';
import { buildIngestionPayload } from '../data/payloadBuilder.js';
import { ingestBatch } from '../services/ingestionService.js';

export function runIngestionFlow() {
  const payload = buildIngestionPayload();

  ingestBatch(payload);
  sleep(1);
}
