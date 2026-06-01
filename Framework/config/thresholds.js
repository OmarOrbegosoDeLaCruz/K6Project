export const dwhIngestionThresholds = {
  http_req_duration: ['p(95)<1500'],
  dwh_ingestion_time: ['p(99)<3000'],
};

export const googleWebThresholds = {
  http_req_duration: ['p(30)<300'],
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

export const googleWebProfiles = {
  load: {
    stages: [
      { duration: '30s', target: 200 },
      { duration: '5m', target: 200 },
      { duration: '30s', target: 0 },
    ],
    thresholds: googleWebThresholds,
  },
  stress: {
    stages: [
      { duration: '1m', target: 200 },
      { duration: '5m', target: 200 },
      { duration: '1m', target: 400 },
      { duration: '5m', target: 400 },
      { duration: '1m', target: 800 },
      { duration: '5m', target: 800 },
      { duration: '1m', target: 1000 },
      { duration: '5m', target: 1000 },
      { duration: '5m', target: 0 },
    ],
    thresholds: googleWebThresholds,
  },
  soak: {
    stages: [
      { duration: '5m', target: 2000 },
      { duration: '8h', target: 2000 },
      { duration: '5m', target: 0 },
    ],
    thresholds: googleWebThresholds,
  },
  spike: {
    stages: [
      { duration: '15s', target: 2000 },
      { duration: '1m', target: 2000 },
      { duration: '15s', target: 0 },
    ],
    thresholds: googleWebThresholds,
  },
};
