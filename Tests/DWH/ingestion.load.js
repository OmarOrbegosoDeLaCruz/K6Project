import { runIngestionFlow } from '../../Framework/flows/ingestionFlow.js';
import { dwhIngestionProfiles } from '../../Framework/config/thresholds.js';

export const options = dwhIngestionProfiles.load;

export default function () {
  runIngestionFlow();
}
