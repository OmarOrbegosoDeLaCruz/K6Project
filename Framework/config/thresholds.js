export const dwhIngestionThresholds = {
  http_req_duration: ['p(95)<1500'],
  dwh_ingestion_time: ['p(99)<3000'],
};

export const dwhIngestionProfiles = {
  load: {
    stages: [
      { duration: '2m', target: 50 },
      { duration: '5m', target: 50 },
      { duration: '1m', target: 0 },
    ],
    thresholds: dwhIngestionThresholds,
  },
  stress: {
    stages: [
      { duration: '1m', target: 50 },
      { duration: '3m', target: 50 },
      { duration: '1m', target: 100 },
      { duration: '3m', target: 100 },
      { duration: '1m', target: 200 },
      { duration: '3m', target: 200 },
      { duration: '2m', target: 0 },
    ],
    thresholds: dwhIngestionThresholds,
  },
  soak: {
    stages: [
      { duration: '5m', target: 50 },
      { duration: '4h', target: 50 },
      { duration: '5m', target: 0 },
    ],
    thresholds: dwhIngestionThresholds,
  },
};
