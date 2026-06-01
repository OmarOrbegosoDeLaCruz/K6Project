export const environments = {
  dwh: {
    ingestionUrl: __ENV.DWH_INGESTION_URL || 'https://api.dwh-gateway.internal/v1/ingest',
  },
};

export function getDwhEnvironment() {
  return environments.dwh;
}
