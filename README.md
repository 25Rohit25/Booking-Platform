<div align="center">
  <h1>🚀 Booking Platform REST API</h1>
  <p>A production-ready, highly scalable, enterprise-grade backend engineered with NestJS, Prisma, and PostgreSQL.</p>
</div>

<br />

## 📖 Project Overview

This project is a high-performance Booking REST API designed as an exemplary portfolio piece. It demonstrates Principal-level backend engineering standards, adhering strictly to **SOLID Principles**, **Clean Architecture**, and **Domain-Driven Design (DDD)** concepts.

The API serves as the robust backbone for a booking platform, handling secure user authentication, service catalog management, and a meticulously guarded finite-state machine (FSM) for booking lifecycles.

## ✨ Enterprise Features

- **Robust Security Framework**: Implemented Helmet, Compression, dynamic CORS, API Versioning, and global `@nestjs/throttler` (Rate Limiting) to thwart brute-force and DDoS attacks.
- **Flawless Authentication**: Hardened JWT-based authentication paired with `passport-local`, mitigating timing attacks via dummy-hashing fallbacks.
- **Race-Condition Immunity**: Utilizing atomic, conditional database queries (`updateMany`) via Prisma to push Finite State Machine constraints down to PostgreSQL row-level locks, entirely eliminating TOC/TOU vulnerabilities.
- **Relational Query Optimization**: Avoids N+1 queries through explicit `select` mapping within Prisma transactions.
- **Global Data Transformation**: Standardized global interceptors mapping every outbound response into a strict `{ success, message, data, timestamp }` contract.
- **World-Class Validation**: Granular DTOs using `class-validator` and `class-transformer` to sanitize inputs (e.g., E.164 phone formats via Google's `libphonenumber-js`, strict decimal constraints, and UUID pipe validations).
- **Scalable Architecture**: Highly modularized code organized cleanly by feature domains.

---

## 🏗 Architecture & Tech Stack

**Core Stack:**
- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL 15
- **ORM:** Prisma
- **Containerization:** Docker & Docker Compose

**Key Libraries:**
- `passport` & `passport-jwt` (Authentication)
- `class-validator` & `class-transformer` (Data hardening)
- `nestjs-pino` (High-performance, JSON-structured logging)
- `@nestjs/swagger` (OpenAPI Spec generation)
- `@nestjs/throttler` (Rate limiting)

---

## 📂 Folder Structure
The application adopts an enterprise-level, feature-based directory tree:

```
src/
├── common/             # Global filters, interceptors, and guards
├── config/             # Environment validation and dynamic configuration
├── core/               # Singleton core modules (Prisma, Logger)
├── modules/            # Feature domains
│   ├── auth/           # Authentication strategies & token logic
│   ├── users/          # User management & security abstraction
│   ├── services/       # Service catalog CRUD
│   └── bookings/       # Booking state machine & temporal logic
├── app.module.ts       # Root module configuration
└── main.ts             # Application bootstrap & middleware pipeline
```

---

## 🚀 Installation & Running Locally

### 1. Prerequisites
- Docker and Docker Compose
- Node.js (v20+)
- npm

### 2. Environment Setup
Clone the `.env.example` file to create your local `.env`.
```bash
cp .env.example .env
```

### 3. Spin up the Database
Start the PostgreSQL container in the background.
```bash
docker-compose up -d
```

### 4. Install Dependencies & Generate Client
```bash
npm install
npx prisma generate
npx prisma db push
```

### 5. Run the Application
```bash
# Development watch mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

---

## 📚 API Documentation (Swagger)

Once the application is running, the interactive OpenAPI documentation is available at:
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

This interface allows you to instantly test endpoints, view DTO schemas, and inspect potential error codes.

---

## 🧠 Design Decisions & Business Rules

### The Booking Finite State Machine (FSM)
Bookings do not simply transition statuses arbitrarily. The `BookingsService` enforces strict business rules atomically:
1. `PENDING` -> `CONFIRMED` or `CANCELLED`.
2. `CANCELLED` -> ❌ Cannot become `COMPLETED`.
3. `COMPLETED` -> ❌ Cannot revert to `PENDING`, `CONFIRMED`, or `CANCELLED`.

### Temporal Logic Isolation
Time zone management is notoriously difficult in backend engineering. This API strictly parses incoming ISO dates, isolates the chronological data, and validates it against absolute UTC timestamps before delegating it to the Prisma database schema. 

### Presentation vs. Domain Logic
Controllers in this API are strictly "paper-thin". They exist solely to unwrap HTTP requests and delegate the payload to the Service layer. Controllers do not append IDs, manipulate dates, or execute business rules.

---

## 🧪 Testing

The repository contains extensive skeleton frameworks for both Unit and End-to-End (E2E) testing.

```bash
# Run Unit Tests
npm run test

# Run E2E Integration Tests (Requires Test DB)
npm run test:e2e
```

## 🚢 CI/CD & Deployment

This repository comes pre-packaged with GitHub Actions `.github/workflows/ci.yml`. On every Pull Request, the pipeline will:
1. Spin up a temporary PostgreSQL instance.
2. Generate the Prisma Client.
3. Lint and Format the codebase.
4. Execute the complete Testing suite.
5. Compile the TypeScript production bundle.

## 🔮 Future Improvements

While this is a production-grade assignment, a live enterprise deployment might further implement:
1. **Redis Caching**: Utilizing `@nestjs/cache-manager` to cache high-traffic public catalog queries (e.g., `GET /services`).
2. **Event-Driven Architecture**: Emitting asynchronous events via RabbitMQ or Kafka when a booking is created, decoupling the email notification service from the core HTTP thread.
3. **Optimistic Locking**: Adding a `@updatedAt` version column to safely handle deep offline editing conflicts in the admin panel.
