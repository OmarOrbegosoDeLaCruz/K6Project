export function buildIngestionPayload() {
  return JSON.stringify({
    batch_id: `batch_${__VU}_${__ITER}`,
    timestamp: new Date().toISOString(),
    data: [
      { record_id: 1, metric: 42.5 },
      { record_id: 2, metric: 88.1 },
    ],
  });
}
