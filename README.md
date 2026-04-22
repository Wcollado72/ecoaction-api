# EcoAction Task Management API

EcoAction is a RESTful API for managing tasks (to‑do list) with user accounts, authentication via JWT, and task filters by status and due date.  
It was built as a final project to practice backend fundamentals: routing, database integration, authentication, validation, error handling, and project structure.

In addition to the API, this project includes a simple frontend prototype (HTML/CSS/JS) that is served by the same Express server to visualize the dashboard layout.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Setup & Run](#setup--run)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
  - [Auth Endpoints](#auth-endpoints)
  - [Task Endpoints](#task-endpoints)
  - [Health Check](#health-check)
- [Frontend Overview](#frontend-overview)
- [Validation & Error Handling](#validation--error-handling)
- [Testing with Postman](#testing-with-postman)
- [Requirements Checklist](#requirements-checklist)
- [Submission Checklist](#submission-checklist)

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL (via Sequelize ORM)
- **Authentication:** JWT (JSON Web Token)
- **Password Hashing:** bcrypt
- **Environment Variables:** dotenv
- **CORS:** cors
- **Frontend Prototype:** Static HTML + CSS (Pico CSS + custom styles) + vanilla JS, served from `public/`

---

## Features

- User registration with encrypted passwords.
- User login with JWT authentication.
- Protected task routes (only authenticated users can access their tasks).
- Task CRUD:
  - Create task
  - Get all tasks (per user)
  - Get one task (per user)
  - Update task
  - Delete task
- Filters:
  - Filter tasks by `status`
  - Filter tasks by `due_date`
- Validations:
  - Required fields
  - Email format
  - Allowed values for `status`
- Centralized error handling with consistent JSON responses.
- Basic frontend dashboard prototype to illustrate how a client could consume the API.

---

## Project Structure

```bash
.
├── src
│   ├── app.js                 # Express app and server startup
│   ├── config
│   │   └── db.js              # Sequelize database configuration
│   ├── controllers
│   │   ├── authController.js  # Register and login logic
│   │   └── taskController.js  # Task CRUD and filters
│   ├── middlewares
│   │   ├── authMiddleware.js  # JWT authentication middleware
│   │   └── errorHandler.js    # Global error handling middleware
│   ├── models
│   │   ├── User.js            # User model (id, email, password, timestamps)
│   │   └── Task.js            # Task model (id, title, description, status, due_date, userId)
│   ├── routes
│   │   ├── authRoutes.js      # /api/auth routes
│   │   └── taskRoutes.js      # /api/tasks routes (protected)
│   └── utils
│       └── appError.js        # Custom error class
│
├── public
│   ├── index.html             # EcoAction dashboard frontend prototype
│   ├── styles.css             # Custom styles for the dashboard
│   ├── app.js                 # Frontend behavior (auth mode toggling, messages)
│   └── assets
│       ├── eco-hero.png       # Hero background image
│       ├── auth-bg.png        # Authentication panel background
│       └── dashboard-bg.png   # Dashboard panel background
│
├── .env                       # Local environment variables (not committed)
├── .env.example               # Example env variables for documentation
├── package.json               # Dependencies and scripts
└── README.md                  # Project documentation
```

---

## Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecoaction_db

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h
```

Description:

- `PORT` – HTTP server port (default 3000).
- `DB_*` – MySQL connection settings.
- `JWT_SECRET` – secret key used to sign JWT tokens.
- `JWT_EXPIRES_IN` – token expiration (e.g. `1h`, `2h`, `7d`).

---

## Setup & Run

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env` file:**

   ```bash
   cp .env.example .env
   # Then edit .env and set your own values
   ```

3. **Check database connection settings** in `.env` and make sure the MySQL server is running and the database exists.

4. **Start the server:**

   ```bash
   npm start
   ```

5. The API will be available at:

   - `http://localhost:3000/api/...`

   The frontend dashboard prototype will be available at:

   - `http://localhost:3000/`

---

## Database Models

### User

| Field      | Type        | Notes                        |
|-----------|-------------|------------------------------|
| `id`      | INTEGER     | Primary key, auto-increment  |
| `email`   | STRING      | Unique, validated as email   |
| `password`| STRING      | Hashed with bcrypt           |
| `createdAt` | DATE      | Managed by Sequelize         |
| `updatedAt` | DATE      | Managed by Sequelize         |

### Task

| Field        | Type        | Notes                                                   |
|-------------|-------------|---------------------------------------------------------|
| `id`        | INTEGER     | Primary key, auto-increment                             |
| `title`     | STRING      | Required                                                |
| `description` | TEXT      | Optional                                                |
| `status`    | ENUM        | One of: `pending`, `in_progress`, `done`               |
| `due_date`  | DATE        | Optional                                                |
| `userId`    | INTEGER     | Foreign key to `User.id` (1 user → many tasks)         |
| `createdAt` | DATE        | Managed by Sequelize                                    |
| `updatedAt` | DATE        | Managed by Sequelize                                    |

Relationship:

- One **User** has many **Tasks**
- One **Task** belongs to exactly one **User**

---

## API Endpoints

Base URL (local):

```text
http://localhost:3000
```

---

### Auth Endpoints

#### POST `/api/auth/register`

Registers a new user.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "MyStrongPassword123"
}
```

**Responses:**

- `201 Created` – user registered successfully
- `400 Bad Request` – validation error (missing fields, invalid email, etc.)
- `409 Conflict` – email already in use

---

#### POST `/api/auth/login`

Logs in an existing user and returns a JWT.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "MyStrongPassword123"
}
```

**Responses:**

- `200 OK` – returns a token and user info
- `400 Bad Request` – validation error
- `401 Unauthorized` – invalid credentials

Typical successful response:

```json
{
  "success": true,
  "message": "Login successful.",
  "token": "JWT_TOKEN_HERE",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

---

### Task Endpoints

All task endpoints require a valid JWT in the `Authorization` header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

#### POST `/api/tasks`

Create a new task.

**Request body:**

```json
{
  "title": "Finish project",
  "description": "Complete all final project requirements",
  "status": "pending",
  "due_date": "2026-05-13"
}
```

**Responses:**

- `201 Created` – task created
- `400 Bad Request` – validation error
- `401 Unauthorized` – missing or invalid token

---

#### GET `/api/tasks`

Get all tasks for the authenticated user. Optional filters:

- `status` – `pending`, `in_progress`, `done`
- `due_date` – `YYYY-MM-DD`

**Examples:**

- Get all tasks:

  ```http
  GET /api/tasks
  ```

- Filter by status:

  ```http
  GET /api/tasks?status=pending
  ```

- Filter by due date:

  ```http
  GET /api/tasks?due_date=2026-05-13
  ```

**Responses:**

- `200 OK` – returns a list of tasks
- `400 Bad Request` – invalid filter value
- `401 Unauthorized` – missing or invalid token

---

#### GET `/api/tasks/:id`

Get a single task belonging to the authenticated user.

**Example:**

```http
GET /api/tasks/1
```

**Responses:**

- `200 OK` – returns the task
- `404 Not Found` – task does not exist or does not belong to the user

---

#### PUT `/api/tasks/:id`

Update a task.

**Request body:**

Any combination of the following fields:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress",
  "due_date": "2026-05-15"
}
```

**Responses:**

- `200 OK` – task updated
- `400 Bad Request` – invalid status or data
- `404 Not Found` – task not found or not owned by user

---

#### DELETE `/api/tasks/:id`

Delete a task.

**Example:**

```http
DELETE /api/tasks/1
```

**Responses:**

- `200 OK` – task deleted
- `404 Not Found` – task not found or not owned by user

---

### Health Check

#### GET `/api/health`

Simple endpoint to confirm the API is running.

**Response:**

```json
{
  "success": true,
  "message": "API is running successfully."
}
```

---

## Frontend Overview

The project includes a small frontend prototype to demonstrate how a client might interact with the API.

- **URL:** `http://localhost:3000/`
- **Files:**
  - `public/index.html` – layout for hero, Authentication panel, and Dashboard panel.
  - `public/styles.css` – visual design (backgrounds, overlays, layout).
  - `public/app.js` – simple logic for switching between login and register modes and showing placeholder messages.

The frontend does **not** replace the API testing process. It is a visual enhancement to the project, showing:

- a hero with an EcoAction introduction,
- an Authentication card with background image and glassmorphism form,
- a Dashboard card with background image and placeholders for:
  - task form,
  - filters,
  - task list.

---

## Validation & Error Handling

- Required fields are validated (e.g., `email`, `password`, `title`).
- Email address is validated as proper format.
- Task `status` is restricted to `pending`, `in_progress`, `done`.
- Errors are handled by a global error middleware and return consistent JSON responses, including:
  - `success: false`
  - `message: <error description>`
  - Optional details for debugging in development mode.

---

## Testing with Postman

A Postman collection is included with:

- Auth:
  - Register
  - Login
- Tasks:
  - Create task
  - Get all tasks
  - Get task by id
  - Update task
  - Delete task
  - Filter by status
  - Filter by due_date
- Health:
  - GET `/api/health`

Steps:

1. Import the Postman collection.
2. Set the base URL (e.g., `http://localhost:3000`).
3. Perform:
   - Registration
   - Login
   - Copy the JWT token
   - Paste token into the `Authorization` header of task requests.

---

## Requirements Checklist

Backend:

- [x] Project initialization with Node.js and Express.
- [x] Basic server and test route.
- [x] Database configuration using environment variables.
- [x] User and Task models with a one‑to‑many relationship.
- [x] User registration endpoint with password hashing (bcrypt).
- [x] Login endpoint with JWT generation.
- [x] Authentication middleware to protect task routes.
- [x] Task CRUD endpoints (create, read, update, delete).
- [x] Filter tasks by `status`.
- [x] Filter tasks by `due_date`.
- [x] Validation for required fields and email format.
- [x] Validation for allowed `status` values.
- [x] Global error handling and consistent error responses.
- [x] API documentation and Postman collection.

Frontend (optional enhancement):

- [x] Simple dashboard prototype served from `/public`.
- [x] Authentication and Dashboard panels with background images.
- [x] Symmetric layout for both panels on desktop.
- [x] Responsive behavior on smaller screens.

Delivery:

- [x] Source code.
- [x] GitHub repository.
- [x] README.md.
- [x] Postman collection.
- [ ] Screenshots of each step.
- [ ] Video presentation of the project.
- [ ] ZIP file with the project content.

---

## Submission Checklist

Before submitting the final project:

- [x] All API requirements implemented and tested locally.
- [x] Frontend prototype working at `http://localhost:3000/`.
- [ ] Screenshots captured (server running, Postman tests, frontend views).
- [ ] Video recorded showing:
  - Server start
  - Health check
  - Register and login
  - Task CRUD and filters
  - Frontend overview
- [ ] ZIP file created with the entire project (source, README, Postman collection, screenshots).
- [x] Latest code pushed to GitHub with this README included.