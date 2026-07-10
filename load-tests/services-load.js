import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { API_URL, generateHtmlReport, authenticateUser } from './helpers.js';

export const successRate = new Rate('successful_requests');
export const serviceLatency = new Trend('service_latency');

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 200 },  // Ramp up to 200 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'successful_requests': ['rate>0.99'], // Success rate > 99%
    'service_latency': ['p(95)<500'],     // 95% of responses < 500ms
  },
};

export function setup() {
  return { token: authenticateUser('services@example.com', 'Pass123!') };
}

export default function (data) {
  const res = http.get(`${API_URL}/services`, {
    headers: { 'Authorization': `Bearer ${data.token}` }
  });

  const isSuccessful = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data array': (r) => Array.isArray(r.json('data')),
  });

  successRate.add(isSuccessful);
  serviceLatency.add(res.timings.duration);

  sleep(1);
}

export function handleSummary(data) {
  return generateHtmlReport(data, 'services-summary.html');
}
