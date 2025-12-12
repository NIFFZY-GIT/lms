# LMS Database Setup Guide

This folder contains the PostgreSQL database schema for the LMS application.

## Prerequisites

- PostgreSQL 14+ installed and running
- psql command-line tool or pgAdmin

## Quick Setup

### 1. Create the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE lms_db;

# Exit psql
\q
```

### 2. Run the Schema

```bash
# Run the schema file
psql -U postgres -d lms_db -f schema.sql
```

Or using pgAdmin:
1. Connect to your PostgreSQL server
2. Create a new database called `lms_db`
3. Open Query Tool
4. Open and run `schema.sql`

### 3. Configure Environment

Update your `.env.local` file with the correct database connection:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/lms_db
```

## Default Admin User

The schema creates a default admin user:
- **Email:** admin@lms.com
- **Password:** admin123

⚠️ **IMPORTANT:** Change this password immediately after first login!

## Database Structure

### Tables

| Table | Description |
|-------|-------------|
| `User` | All users (Admin, Instructor, Student) |
| `Course` | Courses created by admins/instructors |
| `Recording` | Video recordings for courses |
| `Quiz` | Quiz containers for courses |
| `Question` | Questions within quizzes |
| `Answer` | Answer options (4 per question) |
| `Payment` | Student enrollment/payment records |
| `QuizAttempt` | Quiz completion records with scores |
| `QuestionAttempt` | Individual question responses |
| `Announcement` | Public announcements |
| `CourseMaterial` | Additional course materials |

### Relationships

```
User (Admin/Instructor)
  └── Course
        ├── Recording
        ├── Quiz
        │     └── Question
        │           └── Answer
        └── CourseMaterial

User (Student)
  └── Payment (enrollment)
        └── Course
  └── QuizAttempt
        └── QuestionAttempt
```

### User Roles

- **ADMIN**: Full system access, manage all users and content
- **INSTRUCTOR**: Create/manage own courses, recordings, quizzes
- **STUDENT**: Enroll in courses, watch recordings, take quizzes

## Verification Queries

After running the schema, verify with:

```sql
-- Check all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Verify admin user
SELECT id, email, name, role FROM "User" WHERE role = 'ADMIN';

-- Check indexes
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';
```

## Resetting the Database

To completely reset and recreate the database:

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS lms_db;"
psql -U postgres -c "CREATE DATABASE lms_db;"
psql -U postgres -d lms_db -f schema.sql
```

## Troubleshooting

### UUID Extension Error
If you get an error about `uuid-ossp`, run:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Permission Denied
Ensure your PostgreSQL user has CREATE privileges:
```sql
GRANT ALL PRIVILEGES ON DATABASE lms_db TO your_user;
```

### Connection Refused
1. Verify PostgreSQL is running
2. Check the port (default: 5432)
3. Verify pg_hba.conf allows local connections
