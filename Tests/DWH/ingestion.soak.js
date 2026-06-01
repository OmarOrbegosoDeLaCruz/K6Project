import { runIngestionFlow } from '../../Framework/flows/ingestionFlow.js';
import { dwhIngestionProfiles } from '../../Framework/config/thresholds.js';
import { createHandleSummary } from '../../Framework/reporting/summary.js';

export const options = dwhIngestionProfiles.soak;
export const handleSummary = createHandleSummary('dwh-ingestion-soak');

export default function () {
  runIngestionFlow();
}
