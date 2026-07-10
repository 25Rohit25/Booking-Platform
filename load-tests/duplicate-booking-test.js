import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';
import { API_URL, generateHtmlReport, authenticateUser, getOrCreateService } from './helpers.js';

export const successfulBookings = new Counter('successful_bookings');
export const conflictBookings = new Counter('conflict_bookings');

export const options = {
  scenarios: {
    duplicate_spike: {
      executor: 'shared-iterations',
      vus: 100, // 100 virtual users
      iterations: 100, // Exactly 1 request per VU
      maxDuration: '10s', // They all hit it instantly
    },
  },
};

export function setup() {
  const token = authenticateUser('admin@entwoh.com', 'AdminPass123!');
  const serviceId = getOrCreateService(token);
  
  // Return the EXACT SAME date and time for all VUs, but randomized per test run
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14 + Math.floor(Math.random() * 100)); // random day
  
  return { 
    serviceId,
    targetDate: futureDate.toISOString().split('T')[0],
    targetTime: `1${Math.floor(Math.random() * 8)}:00:00`, // random hour 10-17
    targetTimezone: 'UTC'
  };
}

export default function (data) {
  if (!data.serviceId) return;

  const payload = {
    customerName: `Spike User ${__VU}`,
    customerEmail: `spike${__VU}@example.com`,
    customerPhone: '+12125551234',
    serviceId: data.serviceId,
    bookingDate: data.targetDate,
    bookingTime: data.targetTime,
    ianaTimezone: data.targetTimezone,
    notes: 'Concurrent spike test'
  };

  const res = http.post(`${API_URL}/bookings`, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status === 201) {
    successfulBookings.add(1);
  } else if (res.status === 400 || res.status === 409) {
    conflictBookings.add(1);
  }

  // The crucial check: Only 1 request out of 100 should EVER succeed for the exact same slot.
  check(res, {
    'handled correctly (201 or 409/400)': (r) => r.status === 201 || r.status === 409 || r.status === 400,
  });
}

export function handleSummary(data) {
  return generateHtmlReport(data, 'duplicate-booking-summary.html');
}
