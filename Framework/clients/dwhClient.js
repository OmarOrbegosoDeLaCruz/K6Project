import http from 'k6/http';
import { getDwhEnvironment } from '../config/environments.js';

const jsonHeaders = {
  headers: {
    'Content-Type': 'application/json',
  },
};

export function postIngestionBatch(payload) {
  const environment = getDwhEnvironment();

  return http.post(environment.ingestionUrl, payload, jsonHeaders);
}
