export const environments = {
  dwh: {
    ingestionUrl: __ENV.DWH_INGESTION_URL || 'https://api.dwh-gateway.internal/v1/ingest',
  },
  google: {
    webUrl: __ENV.GOOGLE_WEB_URL || 'https://www.google.com/',
  },
};

export function getDwhEnvironment() {
  return environments.dwh;
}

export function getGoogleEnvironment() {
  return environments.google;
}
