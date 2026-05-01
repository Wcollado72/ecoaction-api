# EcoAction Task Management API

RESTful API for managing eco-action tasks with JWT authentication, full CRUD, and task filters.
Built for COMP 2052 using Node.js, Express.js v5, MySQL, and Sequelize ORM.
Includes a fully functional frontend dashboard served from the same Express server.

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Runtime        | Node.js v24+                        |
| Framework      | Express.js v5                       |
| Database       | MySQL via Sequelize ORM             |
| Auth           | JWT + bcrypt + in-memory blacklist  |
| Frontend       | HTML + Pico CSS + Vanilla JS        |

---

## Project Structure

```
ecoaction-api/
├── .env / .env.example
├── docker-compose.yml
├── postman/ecoaction-api.postman_collection.json
├── public/               # Frontend (index.html, styles.css, app.js)
└── src/
    ├── app.js            # Entry point
    ├── config/db.js
    ├── controllers/      # authController.js, taskController.js
    ├── middlewares/      # authMiddleware.js, errorHandler.js
    ├── models/           # User.js, Task.js
    ├── routes/           # authRoutes.js, taskRoutes.js
    └── utils/            # appError.js, tokenBlacklist.js
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env   # then edit .env with your values

# 3. Start MySQL (Docker)
docker-compose up -d

# 4. Run server
npm run dev
# -> http://localhost:3000
```

### Environment Variables (`.env`)

```
PORT=3000
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASS=root_password
DB_NAME=ecoaction_db
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=1h
```

---

## Database Models

**users:** `id`, `email` (unique), `password` (bcrypt), `resetPasswordToken`, `resetPasswordExpiry`, timestamps

**tasks:** `id`, `title`, `description`, `status` (pending/in_progress/done), `due_date`, `userId` (FK), timestamps

Relationship: User has many Tasks (cascade delete).

---

## API Endpoints

Base URL: `http://localhost:3000`

### Authentication

| Method | Endpoint                    | Auth | Description                              |
|--------|-----------------------------|------|------------------------------------------|
| POST   | /api/auth/register          | —    | Register new user                        |
| POST   | /api/auth/login             | —    | Login, returns JWT token                 |
| GET    | /api/auth/me                | JWT  | Get current user profile                 |
| POST   | /api/auth/logout            | JWT  | Blacklist token (server-side logout)     |
| POST   | /api/auth/forgot-password   | —    | Generate reset token (dev: in response)  |
| POST   | /api/auth/reset-password    | —    | Reset password with token                |

**Register / Login body:**
```json
{ "email": "user@example.com", "password": "mypassword123" }
```

**Login success response:**
```json
{ "success": true, "token": "eyJhbGci...", "user": { "id": 1, "email": "user@example.com" } }
```

**Forgot Password body:** `{ "email": "user@example.com" }`
> Dev mode: the raw reset token is returned in the response field `dev_reset_token`.

**Reset Password body:** `{ "token": "<raw_token>", "newPassword": "newpass123" }`

---

### Tasks  *(all require `Authorization: Bearer <token>`)*

| Method | Endpoint           | Description                                     |
|--------|--------------------|-------------------------------------------------|
| POST   | /api/tasks         | Create task (`title` required)                  |
| GET    | /api/tasks         | Get all tasks (optional filters below)          |
| GET    | /api/tasks/:id     | Get single task                                 |
| PUT    | /api/tasks/:id     | Update task fields                              |
| DELETE | /api/tasks/:id     | Delete task                                     |
| POST   | /api/tasks/seed    | Load 10 pre-defined eco tasks (idempotent)      |

**Task filters:**
```
GET /api/tasks?status=pending
GET /api/tasks?due_date=2026-06-01
GET /api/tasks?status=in_progress&due_date=2026-06-01
```
Valid status values: `pending`, `in_progress`, `done`

**Create/Update task body:**
```json
{
  "title": "Plant 10 trees",
  "description": "Coordinate with city parks department",
  "status": "pending",
  "due_date": "2026-06-01"
}
```

---

### Health Check

```
GET /api/health   ->   { "status": "ok", "timestamp": "..." }
```

---

## Error Handling

All errors return a consistent JSON format:
```json
{
  "error": true,
  "message": "Validation error.",
  "details": [{ "field": "email", "message": "Email format is invalid." }]
}
```

HTTP codes used: `400` validation, `401` unauthorized, `404` not found, `409` conflict, `500` server error.

---

## Requirements Checklist

| Part | Requirement                            | Status |
|------|----------------------------------------|--------|
| 1    | Project setup (npm, express, dotenv)   | Done   |
| 2    | Database models + relationships        | Done   |
| 3    | Register + Login + JWT middleware      | Done   |
| 4    | Full task CRUD + status/date filters   | Done   |
| 5    | Input validation on all endpoints      | Done   |
| 6    | Global error handler middleware        | Done   |
| 7    | README with all endpoints documented   | Done   |
| 8    | Postman collection with all tests      | Done   |
| 9    | Folder structure (controllers, routes, models, middlewares, config) | Done |

**Extras implemented:** logout with JWT blacklist, GET /me, forgot/reset password, seed endpoint, fully functional frontend, password visibility toggle, Docker Compose.

---

## Testing with Postman

Import `postman/ecoaction-api.postman_collection.json`. The Login request auto-saves the token to `{{token}}` — all protected requests use it automatically.

Recommended test order:

1. POST /api/auth/register
2. POST /api/auth/login  *(token auto-saved)*
3. GET  /api/auth/me
4. POST /api/tasks/seed
5. POST /api/tasks
6. GET  /api/tasks
7. GET  /api/tasks?status=pending
8. GET  /api/tasks?due_date=YYYY-MM-DD
9. GET  /api/tasks/:id
10. PUT  /api/tasks/:id
11. DELETE /api/tasks/:id
12. POST /api/auth/forgot-password
13. POST /api/auth/reset-password
14. POST /api/auth/logout
15. GET  /api/health

---

## Submission Checklist

- [x] Source code complete and working
- [x] README.md
- [x] Postman collection (`postman/`)
- [ ] Postman screenshots
- [ ] Video demo of full project flow
- [ ] ZIP with all deliverables

---

## Author

William Rafael Collado Santiago — COMP 2052 — May 2026
