# AIEXCH Backend

Scalable backend API built with Elysia, Drizzle ORM, and PostgreSQL.

## Setup

1. Install dependencies:
```bash
bun install
```

2. Setup PostgreSQL database and update `.env` file

3. Generate and run migrations:
```bash
bun run db:generate
bun run db:migrate
```

4. Start development server:
```bash
bun run dev
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Profile
- `GET /profile` - Get user profile (requires auth)
- `PUT /profile` - Update user profile (requires auth)

## Database Schema

### Users Table
- id, username, email, password, role, membership, status

### Profiles Table  
- id, userId, firstName, lastName, birthDate, country, city, address, phone, avatar