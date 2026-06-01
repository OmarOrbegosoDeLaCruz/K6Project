import { runGoogleHomePageFlow } from '../../Framework/flows/googleFlow.js';
import { googleWebProfiles } from '../../Framework/config/thresholds.js';
import { createHandleSummary } from '../../Framework/reporting/summary.js';

export const options = googleWebProfiles.soak;
export const handleSummary = createHandleSummary('google-soak');

export default function () {
  runGoogleHomePageFlow();
}
