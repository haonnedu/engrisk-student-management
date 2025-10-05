# Engrisk Student Management System

A modern student management system built with NestJS, Next.js, PostgreSQL, and Docker.

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **PostgreSQL** - Relational database
- **Prisma** - Type-safe ORM
- **OpenAPI/Swagger** - API documentation and type generation
- **JWT** - Authentication
- **Docker** - Containerization

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **OpenAPI TypeScript Generator** - Auto-generated API types

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd be
npm install

# Install frontend dependencies
cd ../fe
npm install
```

### 2. Start Database

```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Database will be available at:
# - PostgreSQL: localhost:5432
# - Adminer (DB GUI): http://localhost:8080
```

### 3. Setup Database Schema

```bash
cd be
npx prisma migrate dev
npx prisma generate
```

### 4. Start Development Servers

```bash
# Terminal 1: Start backend
cd be
npm run dev

# Terminal 2: Start frontend
cd fe
npm run dev
```

### 5. Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Database GUI**: http://localhost:8080

## Project Structure

```
├── be/                 # Backend (NestJS)
│   ├── src/
│   ├── prisma/
│   └── package.json
├── fe/                 # Frontend (Next.js)
│   ├── src/
│   └── package.json
├── docker-compose.yml  # Database services
└── README.md
```

## Features

- 🎓 Student Management (CRUD)
- 📚 Course Management
- 📝 Enrollment System
- 🔐 JWT Authentication
- 📊 Dashboard Analytics
- 🔄 Auto-generated API Types
- 🐳 Docker Development Environment