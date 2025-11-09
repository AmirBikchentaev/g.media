# 🧩 Task Management Microservice — Test Assignment for GMedia

This project is a **test assignment** for the Backend Developer position at **GMedia**.  
It implements a **modular, type-safe Task Management microservice** that exposes both **REST** and **GraphQL** APIs, integrated with **RabbitMQ** for asynchronous event publishing.

---

## 🛠️ Tech Stack

- **Node.js + TypeScript**
- **Fastify** — web framework
- **GraphQL (Mercurius)** — type-safe resolvers
- **MongoDB (Mongoose)** — database layer
- **RabbitMQ** — Direct Exchange pattern
- **Zod** — runtime validation and serialization
- **AJV + fast-json-stringify** — fallback schema validation for GraphQL
- **Docker Compose** — local environment orchestration
- **Postman** — API and integration testing

---

## ⚙️ Features Summary

### **API Interfaces**

#### **REST API** (`/api`)
| Method | Endpoint | Description |
|---------|-----------|-------------|
| `GET` | `/tasks` | List tasks (optional `?status` filter) |
| `GET` | `/tasks/:id` | Get task by ID |
| `POST` | `/tasks` | Create a new task |
| `PATCH` | `/tasks/:id` | Update an existing task |

#### **GraphQL API** (`/graphql`)
**Queries**
- `getTask(id: ID!)`
- `getTasks(status: TaskStatus)`

**Mutations**
- `createTask(title, description, dueDate, status)`
- `updateTask(id, title, description, status)`

---

### **📡 RabbitMQ Integration**

- **Exchange:** `task.exchange`  
- **Queue:** `task.actions`  
- **Routing Key:** `task.action`

**Published message structure:**
```json
{
  "taskId": "<string>",
  "action": "created" | "updated",
  "timestamp": "<ISO date>"
}
