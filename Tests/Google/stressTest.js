import { runGoogleHomePageFlow } from '../../Framework/flows/googleFlow.js';
import { googleWebProfiles } from '../../Framework/config/thresholds.js';
import { createHandleSummary } from '../../Framework/reporting/summary.js';

export const options = googleWebProfiles.stress;
export const handleSummary = createHandleSummary('google-stress');

export default function () {
  runGoogleHomePageFlow();
}
