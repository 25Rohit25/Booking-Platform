import http from 'k6/http';
import { check } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export const API_URL = __ENV.API_URL || 'http://localhost:3000/api/v1';

export function authenticateUser(email, password) {
  // Try logging in first
  let loginRes = http.post(`${API_URL}/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 401 || loginRes.status === 404 || loginRes.status === 400) {
    // If unauthorized (user doesn't exist), register them
    http.post(`${API_URL}/auth/register`, JSON.stringify({
      fullName: 'Load Test User',
      email,
      password
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    // Try login again
    loginRes = http.post(`${API_URL}/auth/login`, JSON.stringify({ email, password }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has access token': (r) => r.json('data.access_token') !== undefined,
  });

  return loginRes.json('data.access_token');
}

export function getOrCreateService(token) {
  const params = { headers: { 'Authorization': `Bearer ${token}` } };
  const res = http.get(`${API_URL}/services`, params);
  
  if (res.status === 200 && res.json('data') && res.json('data').length > 0) {
    return res.json('data')[0].id;
  }

  // Create a new service if none exists
  const createRes = http.post(`${API_URL}/services`, JSON.stringify({
    title: 'Load Test Service',
    description: 'Automatically created for k6 tests',
    price: 99.99,
    duration: 60,
    isActive: true
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  return createRes.json('data.id');
}

export function generateBookingPayload(serviceId) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // Book 7 days in the future
  
  return {
    customerName: `Test Customer ${Math.floor(Math.random() * 10000)}`,
    customerEmail: `test${Math.floor(Math.random() * 100000)}@example.com`,
    customerPhone: '+12125551234',
    serviceId: serviceId,
    bookingDate: futureDate.toISOString().split('T')[0],
    bookingTime: '14:00:00', // Hardcoded time for simplicity, can be randomized
    ianaTimezone: 'UTC',
    notes: 'Load test booking',
  };
}

export function generateHtmlReport(data, fileName = 'summary.html') {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    [fileName]: htmlReport(data),
  };
}
