# LMS Database Setup Guide

This folder contains the PostgreSQL database schema for the LMS application.

> **`schema.sql` is the canonical file for a *fresh* database.** It is idempotent
> and safe to re-run anywhere. `update_schema.sql` is superseded and no longer needed.
>
> ⚠️ **Re-running `schema.sql` on an existing server does *not* add new columns.**
> Columns are declared inside `CREATE TABLE IF NOT EXISTS`, which does nothing when
> the table already exists. Only the `ALTER TABLE` statements in its "Migration
> Cleanup" section apply to an existing database. To add columns to a live server,
> run the matching migration file below.

## Files in this folder

| File | Purpose | Safe to re-run |
|------|---------|----------------|
| `schema.sql` | Full schema for a **fresh** database | Yes |
| `migrate-payment-features.sql` | Adds the 12 `Payment` columns for receipt duplicate-detection, OCR, paid amounts and rejection reasons **to an existing database** | Yes — additive only |
| `diagnose-payments.sql` | Read-only. Reports which payment columns are missing and whether receipts are still present. Run this first when the admin payments page misbehaves | Yes — SELECTs only |
| `rollback-receipt-detection.sql` | Removes the 12 columns added above | Yes, but see the warnings inside |

Typical upgrade of a live server:

```bash
pg_dump -U <user> <database> > backup.sql              # 1. back up
psql -U <user> -d <database> -f diagnose-payments.sql  # 2. see what's missing
psql -U <user> -d <database> -f migrate-payment-features.sql   # 3. apply
```

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
# Fresh install OR applying updates to an existing server — same command:
psql -U postgres -d lms_db -f schema.sql
```

Or using pgAdmin:
1. Connect to your PostgreSQL server
2. Create a new database called `lms_db` (or use the existing one)
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
