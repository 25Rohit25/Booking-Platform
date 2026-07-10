import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { API_URL, generateBookingPayload, generateHtmlReport, authenticateUser, getOrCreateService } from './helpers.js';

export const bookingSuccessRate = new Rate('booking_success');
export const bookingLatency = new Trend('booking_latency');

export const options = {
  vus: 50, // 50 users simultaneously making bookings
  duration: '1m', 
  thresholds: {
    'booking_success': ['rate>0.95'], // 95% of bookings should succeed
    'booking_latency': ['p(95)<800'], // 95% of bookings should be created in under 800ms
  },
};

export function setup() {
  const token = authenticateUser('admin@entwoh.com', 'AdminPass123!');
  const serviceId = getOrCreateService(token);
  
  return { serviceId, token };
}

export default function (data) {
  if (!data.serviceId) {
    sleep(1);
    return; // Cannot run without a service
  }

  const payload = generateBookingPayload(data.serviceId);
  const res = http.post(`${API_URL}/bookings`, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });

  const isSuccessful = check(res, {
    'status is 201': (r) => r.status === 201,
  });

  bookingSuccessRate.add(isSuccessful);
  bookingLatency.add(res.timings.duration);

  sleep(1);
}

export function handleSummary(data) {
  return generateHtmlReport(data, 'bookings-summary.html');
}
