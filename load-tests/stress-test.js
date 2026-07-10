import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { API_URL, generateHtmlReport, authenticateUser } from './helpers.js';

export const successRate = new Rate('successful_requests');
export const latencyTrend = new Trend('stress_latency');

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // Below normal load
    { duration: '2m', target: 100 }, // Normal load
    { duration: '2m', target: 200 }, // Around breaking point
    { duration: '2m', target: 500 }, // Beyond breaking point
    { duration: '2m', target: 0 },   // Scale down, recovery phase
  ],
  thresholds: {
    'successful_requests': ['rate>0.95'], 
    'stress_latency': ['p(99)<2000'], // Under extreme stress, 99% of requests < 2s
  },
};

export function setup() {
  return { token: authenticateUser('stress@example.com', 'Pass123!') };
}

export default function (data) {
  // Mix of traffic: 80% browsing services, 20% bad bookings
  if (Math.random() < 0.8) {
    const res = http.get(`${API_URL}/services`, {
      headers: { 'Authorization': `Bearer ${data.token}` }
    });
    const isSuccessful = check(res, { 'status is 200': (r) => r.status === 200 });
    successRate.add(isSuccessful);
    latencyTrend.add(res.timings.duration);
  } else {
    // Intentionally sending invalid bookings to stress validation pipeline
    const payload = { customerName: 'Bad', serviceId: 'not-a-uuid' };
    const res = http.post(`${API_URL}/bookings`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
    });
    // Should be rejected quickly by class-validator (400)
    const isSuccessful = check(res, { 'status is 400': (r) => r.status === 400 });
    successRate.add(isSuccessful);
    latencyTrend.add(res.timings.duration);
  }

  sleep(1);
}

export function handleSummary(data) {
  return generateHtmlReport(data, 'stress-summary.html');
}
