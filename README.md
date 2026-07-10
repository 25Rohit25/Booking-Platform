<div align="center">
  <h1>🚀 EN2H Booking Platform REST API</h1>
  <p>A production-ready, highly scalable, enterprise-grade backend engineered with NestJS, Prisma, and PostgreSQL.</p>
</div>

<br />

## 📖 Project Overview

This project is a high-performance REST API designed to manage services and customer bookings for the EN2H Software Engineer Intern Technical Assignment. It is built adhering strictly to **SOLID Principles**, **Clean Architecture**, and **Domain-Driven Design (DDD)** concepts.

The API serves as the robust backbone for a booking platform, handling secure user authentication, service catalog management, and a meticulously guarded finite-state machine (FSM) for booking lifecycles.

### ✨ Features & Bonus Requirements Completed
- ✅ **NestJS & TypeScript** framework
- ✅ **PostgreSQL** Database via Prisma ORM
- ✅ **JWT Authentication** (with Login, Register, Refresh Token, and Logout functionality)
- ✅ **Service & Booking Management** with role-based protections
- ✅ **Pagination** for all list queries
- ✅ **Search & Filtering** for bookings
- ✅ **Swagger Documentation** automatically generated
- ✅ **Docker Support** via Docker Compose for easy database spin-up
- ✅ **Global Validation & Exception Handling**
- ✅ **Prevent Duplicate Bookings** (Race-condition immunity via Prisma transactions)
- ✅ **Extensive Unit & E2E Testing** 

---

## 🛠️ Installation Steps

### 1. Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/) (v20+)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) and Docker Compose (Optional, for database)

### 2. Clone the Repository
```bash
git clone <repository-url>
cd Booking-Platform
```

### 3. Install Dependencies
```bash
npm install
```

---

## 🔐 Environment Variables

The application requires environment variables to connect to the database and configure JWT secrets. 

1. Create a `.env` file in the root directory by copying the example file:
```bash
cp .env.example .env
```
2. Open the `.env` file and ensure the default values meet your local environment settings.

---

## 🗄️ Database Setup & Running Migrations

This project uses PostgreSQL. You can spin up a local instance using the provided `docker-compose.yml`.

### 1. Start the Database
```bash
docker-compose up -d
```

### 2. Run Database Migrations
Sync your database schema with the application models:
```bash
npx prisma generate
npx prisma db push
```

---

## 🚀 Running the Application

Once dependencies are installed and the database is running, you can start the API:

```bash
# Development watch mode (Recommended for testing)
npm run start:dev

# Production build and run
npm run build
npm run start:prod
```

---

## 🧪 Testing

The repository contains extensive frameworks for both Unit and End-to-End (E2E) testing. E2E tests will hit the test database to ensure the entire flow (Authentication -> Token Exchange -> Protected Routes) works seamlessly.

```bash
# Run Unit Tests
npm run test

# Run E2E Integration Tests
npm run test:e2e
```

---

## 📚 API Documentation

Interactive API documentation is generated using **Swagger**. 
Once the application is running, navigate to:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

From here, you can execute API calls directly in your browser. (Note: For protected routes, use the `/auth/login` endpoint to retrieve a token, and use the green "Authorize" button at the top of the Swagger page).

---

## 🤔 Assumptions Made

During the development of this platform, the following business-logic assumptions were made:
1. **Public Booking Creation:** Customers can book services without being authenticated, but only authenticated users (e.g., Staff/Admins) can edit or view all bookings.
2. **Booking Concurrency:** Two users cannot book the exact same service for the exact same date and time. This is prevented at the transaction level to avoid TOC/TOU vulnerabilities.
3. **Strict State Machine:** A cancelled booking cannot be directly transitioned to completed. The state transitions flow strictly forward.
4. **Timezones:** All times are treated globally and validated against the server's UTC time to ensure a booking cannot be made in the past.

---

## 🔮 Future Improvements

While this is a production-grade assignment, a live enterprise deployment might further implement:
1. **Redis Caching**: Utilizing `@nestjs/cache-manager` to cache high-traffic public catalog queries (e.g., `GET /services`).
2. **Event-Driven Architecture**: Emitting asynchronous events via RabbitMQ or Kafka when a booking is created, decoupling the email notification service from the core HTTP thread.
3. **Optimistic Locking**: Adding a `@updatedAt` version column to safely handle deep offline editing conflicts in the admin panel if multiple users modify the same booking simultaneously.
