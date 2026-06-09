# Project Base

Clean full-stack base using Node.js, Express, MongoDB, React, Vite, Ant Design, and Axios.

## Structure

```text
backend/   Express.js REST API with MongoDB connection
frontend/  React app with Ant Design and Axios
```

## Run Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Backend runs at `http://localhost:5000`.

## Run Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Starter Endpoints

- `GET http://localhost:5000/`
- `GET http://localhost:5000/api/health`
