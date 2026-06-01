import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '1m', target: 400 },
    { duration: '5m', target: 400 },
    { duration: '1m', target: 800 },
    { duration: '5m', target: 800 },
    { duration: '1m', target: 1000 },
    { duration: '5m', target: 1000 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(30)<300'],
  },
};

export default function () {
  const res = http.get('https://www.google.com/');

  check(res, {
    '200': (r) => r.status === 200,
  });

  sleep(1);
}
