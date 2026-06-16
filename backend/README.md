# Backend

Node.js, Express, MongoDB, Mongoose, JWT authentication, and admin authorization.

## Setup

```bash
npm install
copy .env.example .env
npm run seed:admin
npm run dev
```

## Scripts

```text
npm run dev        Start development server
npm run seed:admin Create or update first admin account in MongoDB
```

## Endpoints

```text
GET  /
GET  /api/health
POST /api/auth/login
GET  /api/auth/profile
PUT  /api/auth/profile
```