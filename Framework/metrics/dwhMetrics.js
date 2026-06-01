import { Trend } from 'k6/metrics';

export const dwhIngestionTime = new Trend('dwh_ingestion_time');

export function recordDwhProcessingTime(response) {
  const processTime = response.headers['X-DWH-Process-Time'];

  if (processTime) {
    dwhIngestionTime.add(parseFloat(processTime));
  }
}
