# MagmaMath Microservices

This tech-task consists of two microservices: User Service and Notification Service,
used RabbitMQ for message brokering and MongoDB for data storage.

## Services Overview

### User Service (Port 3000)
- Manages user data
- Communicates with MongoDB
- Publishes user events to RabbitMQ

### Notification Service (Port 3001)
- Handles notifications
- Listens to user events from RabbitMQ
- Sends notifications based on events
- http://localhost:3001

## Environment Variables

### User Service (.env)
```env
PORT=3000
MONGO_URI=mongodb://mongodb:27017/magmamath
BROKER_URI=amqp://guest:guest@rabbitmq:5672
QUEUE_NAME=user_queue
```

### Notification Service (.env)
```env
PORT=3001
BROKER_URI=amqp://guest:guest@rabbitmq:5672
QUEUE_NAME=user_queue
```

## Running the Services

### Using Docker Compose (Recommended)

1. Start all services:
```bash
npm run start:docker
```

2. Stop all services:
```bash
npm run stop:docker
```

### Running Locally

1. Start MongoDB and RabbitMQ:
```bash
docker compose up mongodb rabbitmq
```

2. Start User Service:
```bash
cd user-service
npm install
npm run start:dev
```

3. Start Notification Service:
```bash
cd notification-service
npm install
npm run start:dev
```

## API Endpoints

### User Service

#### Health Check
- `GET /health`
  - Returns service health status
  - Checks MongoDB and RabbitMQ connections

#### User Management
http://localhost:3000/

- `POST /users`
  - Create a new user
  - Body: `{ name: string, email: string }`
  
- `PATCH /users/:id`
  - Update user by id
  - Body: `{ name: string, email: string }`

- `DELETE /users/:id`
  - Delete user by Id

- `GET /users/:id/?page=1&limit=10`
  - Get user by Id with pagination
  - Params: `{ page: string, limit: string }`

### Notification Service

#### Health Check

http://localhost:3001/

- `GET /health`
  - Returns service health status
  - Checks RabbitMQ connection

## Message Events

### User Events (Published by User Service)
- `user.created`
  - Published when a new user is created
  - Payload: `{ id: string, name: string, email: string, createdAt: string }`

- `user.deleted`
  - Published when a user is deleted
  - Payload: `{ id: string }`

## Development

### Building Services
```bash
# User Service
cd user-service
npm run build

# Notification Service
cd notification-service
npm run build
```

### Running Tests
```bash
# User Service
cd user-service
npm test

# Notification Service
cd notification-service
npm test
```