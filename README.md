# EcoAction API – Task Management REST API

EcoAction API is a RESTful backend built with Node.js, Express, Sequelize and MySQL.  
It allows users to register, authenticate with JWT, and manage personal tasks (to‑do list) with full CRUD operations and filters by status and due date.

## Features

- User registration with email and hashed password (bcrypt)
- User login with JSON Web Tokens (JWT)
- Protected task endpoints (only authenticated users can access their own tasks)
- Task CRUD:
  - Create a task
  - Get all tasks for the authenticated user
  - Get a single task by id
  - Update a task
  - Delete a task
- Task filters:
  - Filter tasks by `status` (`pending`, `in_progress`, `done`)
  - Filter tasks by `due_date` (all tasks due on a specific day)
- Global error handling and JSON 404 responses
- Health check endpoint

## Technologies

- Node.js
- Express
- MySQL + Sequelize ORM
- JWT (jsonwebtoken)
- bcrypt
- dotenv
- cors

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
│  └─ routes/
│     ├─ authRoutes.js
│     └─ taskRoutes.js
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

The main variables are:

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
- `email` – string, required, unique, valid email format
- `password` – string, required (stored as bcrypt hash)
- `createdAt`, `updatedAt` – timestamps (managed by Sequelize)

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

- Missing `email` or `password` → `400 Bad Request`
- Invalid email format → `400 Bad Request`
- Email already registered → `400 Bad Request`

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

The `token` field contains the JWT that must be used in protected routes.

---

### Authentication – Using the Token

For all `/api/tasks` endpoints, you must send the JWT in the `Authorization` header as a Bearer token:

```http
Authorization: Bearer <JWT_TOKEN_HERE>
```

In Postman:

- Go to the **Authorization** tab
- Select **Bearer Token**
- Paste the token in the token field (without `Bearer` word)

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

Example response:

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

Example:

`GET /api/tasks/1`

Headers: Authorization as above.

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

If the task does not exist or does not belong to the user → `404 Task not found`.

#### Update Task

**PUT** `/api/tasks/:id`

Example:

`PUT /api/tasks/1`

Request body (any combination of fields):

```json
{
  "title": "Finish final project (updated)",
  "status": "in_progress"
}
```

Response:

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

#### Delete Task

**DELETE** `/api/tasks/:id`

Example:

`DELETE /api/tasks/1`

Response:

```json
{
  "success": true,
  "message": "Task deleted successfully."
}
```

---

### Task Filters

#### Filter by Status

**GET** `/api/tasks?status=in_progress`

Supported values: `pending`, `in_progress`, `done`.

Example response:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 2,
      "title": "Filter test task",
      "description": "Testing filters",
      "status": "in_progress",
      "due_date": "2026-05-13T18:00:00.000Z",
      "userId": 1,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

If status is invalid → `400 Bad Request`.

#### Filter by Due Date

**GET** `/api/tasks?due_date=2026-05-13`

The API will return all tasks whose `due_date` falls on that date (regardless of time).

Example response:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 2,
      "title": "Filter test task",
      "description": "Testing filters",
      "status": "in_progress",
      "due_date": "2026-05-13T18:00:00.000Z",
      "userId": 1,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

## Error Handling

- Validation errors (Sequelize) → `400` with list of fields and messages  
- Unique constraint errors (e.g. duplicate email) → `400`  
- Missing or invalid JWT → `401 Unauthorized`  
- Accessing tasks that do not belong to the user → `404 Task not found`  
- Unknown routes → `404 Route not found`  
- Unhandled errors → `500 Internal server error`

All error responses follow a JSON structure:

```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## Testing with Postman

Recommended test flow:

1. `POST /api/auth/register` – create a new user.  
2. `POST /api/auth/login` – get the JWT token.  
3. Set Bearer Token in Postman Authorization tab.  
4. `POST /api/tasks` – create one or more tasks.  
5. `GET /api/tasks` – list tasks.  
6. `GET /api/tasks/:id` – get a single task.  
7. `PUT /api/tasks/:id` – update task fields.  
8. `DELETE /api/tasks/:id` – remove a task.  
9. `GET /api/tasks?status=...` – test status filter.  
10. `GET /api/tasks?due_date=YYYY-MM-DD` – test due date filter.  

Export your Postman collection to include it in the project submission.

---

## Screenshots and Video (for course submission)

Suggested screenshots:

- Terminal showing `node src/app.js` running and tables synchronized.
- Successful `POST /api/auth/register`.
- Successful `POST /api/auth/login` with token.
- Successful `POST /api/tasks`.
- Successful `GET /api/tasks`.
- Successful `GET /api/tasks/:id`.
- Successful `PUT /api/tasks/:id`.
- Successful `DELETE /api/tasks/:id`.
- Successful filters by `status` and `due_date`.
- `GET /api/health`.

Suggested video (short demo):

- Start the server.  
- Show health check.  
- Show register and login.  
- Show creating, listing, updating and deleting tasks.  
- Show filters by status and due date.

---

## License

This project is for educational purposes as part of a back‑end development course.