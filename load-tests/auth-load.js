import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { API_URL, generateHtmlReport } from './helpers.js';

export const failedAuthRate = new Rate('failed_authentication');

export const options = {
  vus: 20, // 20 concurrent users trying to authenticate
  duration: '1m', // Run for 1 minute
  thresholds: {
    'failed_authentication': ['rate<0.05'], // Less than 5% authentication failures allowed
    http_req_duration: ['p(95)<600'], // 95% of requests under 600ms (auth is computationally heavy due to bcrypt)
  },
};

export default function () {
  const email = `test${__VU}@example.com`;
  const password = 'StrongPassword123!';

  // Optional: Register first just in case they don't exist
  if (__ITER === 0) {
    http.post(`${API_URL}/auth/register`, JSON.stringify({
      fullName: `User ${__VU}`,
      email: email,
      password: password
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Attempt login
  const loginRes = http.post(`${API_URL}/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const isSuccessful = check(loginRes, {
    'status is 200': (r) => r.status === 200,
    'jwt access token generated': (r) => r.json('data.access_token') !== undefined,
  });

  if (!isSuccessful) {
    failedAuthRate.add(1);
  } else {
    failedAuthRate.add(0);
  }

  sleep(1);
}

export function handleSummary(data) {
  return generateHtmlReport(data, 'auth-summary.html');
}
