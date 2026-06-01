import { runGoogleHomePageFlow } from '../../Framework/flows/googleFlow.js';
import { googleWebProfiles } from '../../Framework/config/thresholds.js';

export const options = googleWebProfiles.spike;

export default function () {
  runGoogleHomePageFlow();
}
