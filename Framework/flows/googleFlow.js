import { check, sleep } from 'k6';
import http from 'k6/http';
import { getGoogleEnvironment } from '../config/environments.js';

export function runGoogleHomePageFlow() {
  const environment = getGoogleEnvironment();
  const res = http.get(environment.webUrl);

  check(res, {
    '200': (r) => r.status === 200,
  });

  sleep(1);
}
