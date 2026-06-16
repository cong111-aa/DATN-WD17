# TRO PLUS

Full-stack project using Node.js, Express, MongoDB, React, Ant Design, Axios, JWT authentication, and admin authorization.

## Backend

```bash
cd backend
npm install
copy .env.example .env
npm run seed:admin
npm run dev
```

Default backend URL: `http://localhost:5000`

Default admin from `.env.example`:

```text
Email: admin@example.com
Password: 123456
```

## Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Default frontend URL: `http://localhost:5173`

## Current Auth Flow

- Public registration is disabled.
- Admin account is created directly in MongoDB by `npm run seed:admin`.
- Admin can log in and access `/admin`.
- Tenant account creation will be built later as a separate feature.
- Roles are only `admin` and `user`.
- JWT is sent with `Authorization: Bearer <token>`.

## Main Auth APIs

```text
POST /api/auth/login
GET  /api/auth/profile
PUT  /api/auth/profile
```