# FoundIt — Campus Lost & Found Management System

FoundIt is a centralised web platform designed for university campuses, facilitating the reporting of lost belongings, registration of found items, and secure ownership claim processing with strict privacy guarantees.

## Technology Stack (MERN)
- **Frontend**: React (Vite), React Router, Axios, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas with Mongoose
- **Validation**: Zod (client & server)
- **Security**: JWT, bcryptjs, Helmet, CORS, express-rate-limit

## Project Structure
```text
foundit/
  client/       # React SPA (Vite)
  server/       # Express REST API
  docs/         # Documentation, progress tracking, test logs, screenshots
```

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+)
- MongoDB Atlas cluster connection string

### Environment Configuration
1. Copy `.env.example` in `server/` to `server/.env` and configure variables.
2. Copy `.env.example` in `client/` to `client/.env` and set `VITE_API_BASE_URL`.

### Running Locally
See individual instructions in `client/README.md` and `server/README.md`.
