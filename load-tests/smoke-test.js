import http from 'k6/http';
import { check, sleep } from 'k6';
import { API_URL, generateHtmlReport, authenticateUser } from './helpers.js';

export const options = {
  vus: 3, // Minimal virtual users for a smoke test
  duration: '1m', // Run for 1 minute to check system stability
  thresholds: {
    http_req_duration: ['p(99)<500'], // 99% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

export function setup() {
  return { token: authenticateUser('smoke@example.com', 'Pass123!') };
}

export default function (data) {
  const res = http.get(`${API_URL}/services`, {
    headers: { 'Authorization': `Bearer ${data.token}` }
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has success flag': (r) => r.json('success') === true,
  });

  sleep(1);
}

export function handleSummary(data) {
  return generateHtmlReport(data, 'smoke-summary.html');
}
