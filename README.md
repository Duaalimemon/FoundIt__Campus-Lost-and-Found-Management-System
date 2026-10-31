# FoundIt — Campus Lost & Found Management System

<p align="center">
  <strong>A Smarter Way to Reconnect Lost Items with Their Owners.</strong>
</p>

<p align="center">
  A centralized campus platform designed to make reporting, discovering, and claiming lost and found items easier, faster, and more organized.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Project-MERN%20Stack-16A34A?style=for-the-badge" alt="MERN Stack"/>
  <img src="https://img.shields.io/badge/Status-Development-2563EB?style=for-the-badge" alt="Development"/>
  <img src="https://img.shields.io/badge/License-Academic%20Project-7C3AED?style=for-the-badge" alt="Academic Project"/>
</p>

---

## About the Project

Losing personal belongings on campus can be frustrating. Finding the right person to contact or knowing whether an item has been recovered is not always easy.

**FoundIt** is a web-based Campus Lost & Found Management System developed to simplify this process through a centralized digital platform.

Students can report lost belongings, browse reported items, submit ownership claims, and track their claim activity. Staff members can manage reported items and review submitted claims through a dedicated staff portal.

The goal is to create a more organized, accessible, and reliable lost-and-found experience within a university environment.

## Key Features

### Student Portal

- **Student Authentication:** Secure registration and login.
- **Google Sign-In:** Convenient authentication using Google.
- **Lost Item Reporting:** Submit detailed reports about missing belongings.
- **Found Items Directory:** Browse available found-item reports.
- **Search & Filtering:** Find relevant items through available filters.
- **Claim Submission:** Submit requests to claim found belongings.
- **Personal Profile:** Access personal information and submitted activity.
- **Forgot Password:** Secure password recovery through email.
- **Email Verification of Recovery:** Password reset links delivered through SMTP email.

### Staff Portal

- **Staff Authentication:** Dedicated staff login.
- **Dashboard:** Access the staff management interface.
- **Claims Management:** Review student ownership claims.
- **Approve Claims:** Approve valid ownership requests.
- **Reject Claims:** Reject requests with an administrative note.
- **Live Claim Queue:** View and manage claim requests using backend data.
- **Action Feedback:** Instant success notifications when claims are approved or rejected.

### User Experience

- Responsive layouts for different screen sizes.
- Reusable UI components.
- Breadcrumb navigation.
- Light and dark theme support.
- Loading, error, success, and empty states.
- Scroll-to-top navigation behavior.
- Accessible form controls and confirmation dialogs.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | Tailwind CSS, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT, bcrypt |
| Google Authentication | Google Identity Services |
| Email Service | Nodemailer, Gmail SMTP |
| Validation | Zod |
| API Testing | Postman / Automated API Tests |
| Version Control | Git & GitHub |

## Application Architecture

FoundIt follows a client-server architecture using the MERN stack.

```text
                FOUNDIT APPLICATION
                         |
              +----------+----------+
              |                     |
         Student Portal        Staff Portal
              |                     |
              +----------+----------+
                         |
                  React Frontend
                     (Vite)
                         |
                    REST APIs
                         |
                Node.js + Express
                         |
              +----------+----------+
              |                     |
          MongoDB Atlas       External Services
                                  |
                         +--------+--------+
                         |                 |
                    Google Auth       Gmail SMTP
```

## Project Structure

```text
FoundIt/
│
├── client/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── components/
│       │   ├── common/
│       │   ├── items/
│       │   └── layout/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       ├── routes/
│       └── utils/
│
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── scripts/
│       ├── services/
│       └── validators/
│
├── .gitignore
└── README.md
```

## Getting Started

Follow these instructions to run FoundIt locally.

### 1. Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- MongoDB Atlas account
- Git

### 2. Clone the Repository

```bash
git clone https://github.com/Duaalimemon/FoundIt.git
cd FoundIt
```

### 3. Install Dependencies

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

### 4. Environment Configuration

Create local environment files using the provided example templates.

For the backend:

```bash
cd server
cp .env.example .env
```

For the frontend:

```bash
cd ../client
cp .env.example .env
```

On Windows, you can also manually copy each `.env.example` file and rename the copy to `.env`.

Configure the required environment variables using the corresponding example files.

**Backend configuration may include:**

- MongoDB connection URI
- JWT secret
- Server port
- Google authentication configuration
- SMTP host and port
- SMTP username and App Password
- Email sender information
- Frontend origin / client URL

**Frontend configuration may include:**

- Backend API URL
- Google OAuth Client ID

Use your own credentials and local configuration. Never commit real `.env` files or expose private credentials.

### 5. Run the Application

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in a separate terminal:

```bash
cd client
npm run dev
```

Open the local frontend URL displayed by Vite, usually:

```text
http://localhost:5173
```

The backend development server is configured to run on:

```text
http://localhost:5000
```

*Refer to the package scripts and environment configuration if your local ports differ.*

## Security & Privacy

Security and data protection are important considerations in FoundIt.

- Password hashing using bcrypt.
- JWT-based authentication.
- Protected routes and role-based access controls.
- Server-side request validation.
- Authentication rate limiting.
- Environment-based secret management.
- Restricted exposure of sensitive user information.
- Separate student and staff authentication sessions.

Never upload database credentials, SMTP App Passwords, JWT secrets, or other private environment values to GitHub.

## Testing

FoundIt includes automated testing for important backend functionality and application workflows.

The project has undergone verification of:

- Database models and validation.
- Authentication and authorization.
- Lost and found item operations.
- Claim submission and management.
- Claim lifecycle workflows.
- Frontend production build.

## Future Scope

Potential improvements for future versions include:

- Real-time notifications for claim status updates.
- Advanced item matching and search.
- Image-based item identification.
- Enhanced administrative analytics.
- Additional campus-wide management capabilities.

These are future possibilities, not claims about currently implemented functionality.

## Academic Project

FoundIt is developed as a university semester project with the objective of applying practical web engineering concepts to a real-world campus problem.

**Project:** FoundIt — Campus Lost & Found Management System  
**Domain:** Full Stack Web Development  
**Architecture:** MERN Stack  
**Repository:** [github.com/Duaalimemon/FoundIt](https://github.com/Duaalimemon/FoundIt)

## Author

**Dua Ali Memon**

Software Engineering Student | MERN Stack Developer

- GitHub: [@Duaalimemon](https://github.com/Duaalimemon)
- Portfolio: [View Portfolio](https://duaamemon-portfolio.vercel.app/)

---

<p align="center">
  <strong>Found something? Help it find its way home.</strong>
</p>

<p align="center">
  Made with care for a better campus experience.
</p>
