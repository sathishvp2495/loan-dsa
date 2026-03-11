# Loan DSA Production Starter (Node.js + React + PostgreSQL + WhatsApp)

This project is a production-oriented starter for a **loan lead management system** that tracks a customer from **lead capture** to **loan disbursement**.

## What is included

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT-based admin/agent login
- **Lead tracking:** lead stages, notes, assignment, commission tracking
- **WhatsApp:** Twilio WhatsApp integration hooks for outbound notifications and inbound webhooks
- **Schema docs:** Prisma schema + SQL schema + sample database queries

## Business workflow covered

1. Public lead capture
2. Admin/agent login
3. Assign lead to agent
4. Move customer across the lifecycle:
   - NEW_LEAD
   - CONTACT_ATTEMPTED
   - CONTACTED
   - QUALIFIED
   - DOCS_PENDING
   - BANK_SUBMITTED
   - SANCTIONED
   - DISBURSED
   - REJECTED
   - CLOSED
5. Add notes for every follow-up
6. Record commission when the loan is disbursed
7. Send WhatsApp notifications
8. Receive WhatsApp replies through webhooks

---

## Project structure

```text
loan-dsa-production/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── docs/
│   └── database/
│       ├── schema.sql
│       └── queries.sql
└── docker-compose.yml
```

---

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop or Docker Engine
- PostgreSQL is provided through Docker Compose in development

---

## Quick start

### 1) Start PostgreSQL

From the project root:

```bash
docker compose up -d postgres
```

### 2) Configure the backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Backend runs on:

```text
http://localhost:4000
```

### 3) Configure the frontend

Open a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## Default login

The seed script creates these users:

- **Admin**
  - email: `admin@loandsa.local`
  - password: `Admin@12345`

- **Agent**
  - email: `agent@loandsa.local`
  - password: `Agent@12345`

Change them immediately in a real environment.

---

## Important API endpoints

### Public
- `POST /api/v1/leads/public`

### Authenticated
- `POST /api/v1/auth/login`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/leads`
- `GET /api/v1/leads/:leadId`
- `PATCH /api/v1/leads/:leadId/stage`
- `PATCH /api/v1/leads/:leadId/assign`
- `POST /api/v1/leads/:leadId/notes`
- `PUT /api/v1/leads/:leadId/commission`
- `POST /api/v1/leads/:leadId/whatsapp/send`
- `GET /api/v1/users/agents`

### Webhooks
- `POST /api/v1/webhooks/twilio/whatsapp`
- `POST /api/v1/webhooks/twilio/status`

---

## WhatsApp integration setup (Twilio)

1. Create a Twilio account and enable WhatsApp.
2. Put Twilio credentials into `backend/.env`
3. Configure these URLs in Twilio:
   - inbound webhook: `POST /api/v1/webhooks/twilio/whatsapp`
   - status callback: `POST /api/v1/webhooks/twilio/status`
4. Add template SIDs if you want automated outbound template notifications.

### Backend environment variables related to WhatsApp

See `backend/.env.example`.

Key ones:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_STATUS_CALLBACK_URL`
- `TWILIO_WHATSAPP_LEAD_TEMPLATE_SID`
- `TWILIO_WHATSAPP_STATUS_TEMPLATE_SID`

---

## Production notes

This starter is designed with production structure in mind, but you still need to complete the following before going live:

- set strong secrets
- enable HTTPS
- use real domains
- restrict CORS
- put the API behind a reverse proxy
- rotate credentials
- use managed PostgreSQL backups
- add audit policies and monitoring
- add Twilio signature validation for webhook hardening
- add pagination and export features if the team grows

---

## Database schema

- Prisma schema: `backend/prisma/schema.prisma`
- SQL schema: `docs/database/schema.sql`
- Sample operations: `docs/database/queries.sql`

---

## Suggested next upgrades

- RBAC screens for admin vs agent permissions
- lender table and lender matching rules
- scheduled reminders for follow-up calls
- analytics with conversion funnel
- background job queue for reminders and retries
- webhook signature validation and idempotency keys
