import { runGoogleHomePageFlow } from '../../Framework/flows/googleFlow.js';
import { googleWebProfiles } from '../../Framework/config/thresholds.js';
import { createHandleSummary } from '../../Framework/reporting/summary.js';

export const options = googleWebProfiles.spike;
export const handleSummary = createHandleSummary('google-spike');

export default function () {
  runGoogleHomePageFlow();
}
