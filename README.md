# EcoAction API – Task Management REST API

EcoAction API is a RESTful backend built with Node.js, Express, Sequelize and MySQL.  
It allows users to register, authenticate with JWT, and manage personal tasks (to‑do list) with full CRUD operations and filters by status and due date.

---

## Features

- User registration with email and hashed password (bcrypt)
- User login with JSON Web Tokens (JWT)
- Authentication middleware that protects all task routes
- Task CRUD:
  - Create a task
  - Get all tasks for the authenticated user
  - Get a single task by id
  - Update a task
  - Delete a task
- Task filters:
  - Filter tasks by `status` (`pending`, `in_progress`, `done`)
  - Filter tasks by `due_date` (all tasks due on a specific day)
- Global error handling with consistent JSON responses
- Health check endpoint to verify API availability
- Environment-based configuration with `.env` and `.env.example`
- Docker Compose file to run MySQL in a container

---

## Technologies

- Node.js
- Express
- MySQL + Sequelize ORM
- JWT (jsonwebtoken)
- bcrypt
- dotenv
- cors
- Docker (for local MySQL)

---

## Project Structure

```text
ecoaction-api/
├─ src/
│  ├─ app.js
│  ├─ config/
│  │  └─ db.js
│  ├─ controllers/
│  │  ├─ authController.js
│  │  └─ taskController.js
│  ├─ middlewares/
│  │  ├─ authMiddleware.js
│  │  └─ errorHandler.js
│  ├─ models/
│  │  ├─ User.js
│  │  └─ Task.js
│  ├─ routes/
│  │  ├─ authRoutes.js
│  │  └─ taskRoutes.js
│  └─ utils/
│     └─ appError.js
├─ .env
├─ .env.example
├─ docker-compose.yml
├─ package.json
└─ package-lock.json
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>.git
cd ecoaction-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Then update the values with your local configuration.

Main variables:

- `PORT` – API port (default: `3000`)
- `DB_HOST` – MySQL host (for local Docker: `localhost`)
- `DB_USER` – MySQL user (for Docker example: `root`)
- `DB_PASS` – MySQL password
- `DB_NAME` – MySQL database name (`ecoaction_db`)
- `DB_PORT` – MySQL port (Docker example uses `3307` on host)
- `JWT_SECRET` – secret key used to sign JWT tokens
- `JWT_EXPIRES_IN` – token expiration (for example: `1h`)

### 4. Start MySQL with Docker (optional but recommended)

The project includes a `docker-compose.yml` that runs a MySQL 8.0 container.

```bash
docker compose up -d
```

This will:

- Create a container named `ecoaction_mysql`
- Expose MySQL on port `3307` on your machine
- Create a database named `ecoaction_db`

Make sure `.env` matches these values.

### 5. Run the API

During development you can run the API with Node directly:

```bash
node src/app.js
```

If everything is configured correctly, you should see:

- A successful connection message to MySQL
- Tables synchronized successfully
- Server running at `http://localhost:3000`

---

## Database Models

### User

Table: `users`

Fields:

- `id` – integer, primary key, auto‑increment
- `email` – string, required, unique, trimmed and stored in lowercase, valid email format
- `password` – string, required (stored as bcrypt hash)
- `createdAt`, `updatedAt` – timestamps (managed by Sequelize)

Validation:

- Email is required, must be a valid email and between 5 and 255 characters.
- Password is required and validated at controller level (minimum length, not empty).

### Task

Table: `tasks`

Fields:

- `id` – integer, primary key, auto‑increment
- `title` – string, required, 3–100 characters
- `description` – text, optional
- `status` – ENUM, required, values: `pending`, `in_progress`, `done`
- `due_date` – date/time, optional
- `userId` – foreign key to `users.id`
- `createdAt`, `updatedAt` – timestamps

Relationships:

- One `User` has many `Task` (`User.hasMany(Task)`)
- One `Task` belongs to one `User` (`Task.belongsTo(User)`)

---

## API Endpoints

All responses are JSON.

### Health Check

**GET** `/api/health`  
Response:

```json
{
  "success": true,
  "message": "API is running successfully."
}
```

---

### Authentication

#### Register

**POST** `/api/auth/register`

Request body:

```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

Example success response:

```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "id": 1,
    "email": "test@example.com"
  }
}
```

Validation / error cases:

- Missing `email` or `password` → `400 Bad Request` with:

```json
{
  "success": false,
  "message": "Validation error.",
  "errors": [
    {
      "field": "email",
      "message": "Email is required."
    }
  ]
}
```

- Password too short → `400 Bad Request`:

```json
{
  "success": false,
  "message": "Validation error.",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 6 characters long."
    }
  ]
}
```

- Email already registered → `409 Conflict`:

```json
{
  "success": false,
  "message": "This email is already registered.",
  "errors": [
    {
      "field": "email",
      "message": "This email is already registered."
    }
  ]
}
```

#### Login

**POST** `/api/auth/login`

Request body:

```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

Example success response:

```json
{
  "success": true,
  "message": "Login successful.",
  "token": "<JWT_TOKEN_HERE>",
  "user": {
    "id": 1,
    "email": "test@example.com"
  }
}
```

Error case (invalid credentials):

```json
{
  "success": false,
  "message": "Invalid credentials."
}
```

---

### Authentication – Using the Token

For all `/api/tasks` endpoints, you must send the JWT in the `Authorization` header as a Bearer token:

```http
Authorization: Bearer <JWT_TOKEN_HERE>
```

In Postman:

- Go to the **Authorization** tab
- Select **Bearer Token**
- Paste the token in the token field (without adding `Bearer` manually if Postman does it for you)

---

### Tasks – CRUD

#### Create Task

**POST** `/api/tasks`

Headers:

```http
Authorization: Bearer <JWT_TOKEN_HERE>
Content-Type: application/json
```

Request body:

```json
{
  "title": "Finish final project",
  "description": "Complete API documentation and testing",
  "status": "pending",
  "due_date": "2026-05-13T18:00:00.000Z"
}
```

Example success response:

```json
{
  "success": true,
  "message": "Task created successfully.",
  "data": {
    "id": 1,
    "title": "Finish final project",
    "description": "Complete API documentation and testing",
    "status": "pending",
    "due_date": "2026-05-13T18:00:00.000Z",
    "userId": 1,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Validation error examples:

- Missing title:

```json
{
  "success": false,
  "message": "Validation error.",
  "errors": [
    {
      "field": "title",
      "message": "Title is required."
    }
  ]
}
```

- Invalid status:

```json
{
  "success": false,
  "message": "Validation error.",
  "errors": [
    {
      "field": "status",
      "message": "Invalid status value. Allowed values: pending, in_progress, done."
    }
  ]
}
```

#### Get All Tasks

**GET** `/api/tasks`

Headers:

```http
Authorization: Bearer <JWT_TOKEN_HERE>
```

Example response:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "title": "Finish final project",
      "description": "Complete API documentation and testing",
      "status": "pending",
      "due_date": "2026-05-13T18:00:00.000Z",
      "userId": 1,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### Get Task by ID

**GET** `/api/tasks/:id`

Example: `GET /api/tasks/1`

Headers: same Authorization as above.

Response (success):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Finish final project",
    "description": "Complete API documentation and testing",
    "status": "pending",
    "due_date": "2026-05-13T18:00:00.000Z",
    "userId": 1,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

If the task does not exist or does not belong to the user:

```json
{
  "success": false,
  "message": "Task not found."
}
```

#### Update Task

**PUT** `/api/tasks/:id`

Example: `PUT /api/tasks/1`

Request body (any combination of fields):

```json
{
  "title": "Finish final project (updated)",
  "status": "in_progress"
}
```

Example success response:

```json
{
  "success": true,
  "message": "Task updated successfully.",
  "data": {
    "id": 1,
    "title": "Finish final project (updated)",
    "description": "Complete API documentation and testing",
    "status": "in_progress",
    "due_date": "2026-05-13T18:00:00.000Z",
    "userId": 1,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Validation error examples:

- Empty title:

```json
{
  "success": false,
  "message": "Validation error.",
  "errors": [
    {
      "field": "title",
      "message": "Title cannot be empty."
    }
  ]
}
```

- Invalid status:

```json
{
  "success": false,
  "message": "Validation error.",
  "errors": [
    {
      "field": "status",
      "message": "Invalid status value. Allowed values: pending, in_progress, done."
    }
  ]
}
```

If the task does not exist or does not belong to the user:

```json
{
  "success": false,
  "message": "Task not found."
}
```

#### Delete Task

**DELETE** `/api/tasks/:id`

Example: `DELETE /api/tasks/1`

Success response:

```json
{
  "success": true,
  "message": "Task deleted successfully."
}
```

If the task does not exist or does not belong to the user:

```json
{
  "success": false,
  "message": "Task not found."
}
```

---

### Task 