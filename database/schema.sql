-- ============================================
-- LMS Database Schema for PostgreSQL
-- ============================================
-- Run this script to create all required tables
-- Make sure you have created the database first:
--   CREATE DATABASE lms_db;
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM Types
-- ============================================

-- User Role Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'INSTRUCTOR', 'STUDENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment Status Enum
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- User Table
-- ============================================
-- Central user table storing all user types (Admin, Instructor, Student)
CREATE TABLE IF NOT EXISTS "User" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    role user_role NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for User table
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_user_phone ON "User"(phone);

-- ============================================
-- Course Table
-- ============================================
-- Stores all courses created by admins/instructors
CREATE TABLE IF NOT EXISTS "Course" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tutor VARCHAR(255),
    "imageUrl" TEXT,
    "whatsappGroupLink" TEXT,
    "zoomLink" TEXT,
    "createdById" VARCHAR(36) NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Course table
CREATE INDEX IF NOT EXISTS idx_course_created_by ON "Course"("createdById");
CREATE INDEX IF NOT EXISTS idx_course_created_at ON "Course"("createdAt" DESC);

-- ============================================
-- Recording Table
-- ============================================
-- Stores video recordings for courses
CREATE TABLE IF NOT EXISTS "Recording" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title VARCHAR(500) NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "courseId" VARCHAR(36) NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Recording table
CREATE INDEX IF NOT EXISTS idx_recording_course ON "Recording"("courseId");

-- ============================================
-- Quiz Table
-- ============================================
-- Quiz container - each quiz belongs to a course
CREATE TABLE IF NOT EXISTS "Quiz" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title VARCHAR(500) NOT NULL,
    "courseId" VARCHAR(36) NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Quiz table
CREATE INDEX IF NOT EXISTS idx_quiz_course ON "Quiz"("courseId");

-- ============================================
-- Question Table
-- ============================================
-- Questions within a quiz - can have text and/or image
CREATE TABLE IF NOT EXISTS "Question" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "questionText" TEXT,  -- Nullable to allow image-only questions
    "imageUrl" TEXT,      -- Optional image for the question
    "quizId" VARCHAR(36) NOT NULL REFERENCES "Quiz"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Question table
CREATE INDEX IF NOT EXISTS idx_question_quiz ON "Question"("quizId");

-- ============================================
-- Answer Table
-- ============================================
-- Answer options for each question (typically 4 per question)
CREATE TABLE IF NOT EXISTS "Answer" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "answerText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT FALSE,
    "questionId" VARCHAR(36) NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Answer table
CREATE INDEX IF NOT EXISTS idx_answer_question ON "Answer"("questionId");

-- ============================================
-- Payment Table
-- ============================================
-- Tracks student enrollment payments/receipts
CREATE TABLE IF NOT EXISTS "Payment" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "studentId" VARCHAR(36) NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "courseId" VARCHAR(36) NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
    "receiptUrl" TEXT,
    "referenceNumber" VARCHAR(100) UNIQUE,  -- Reference number for approved payments
    status payment_status NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure a student can only have one payment record per course
    UNIQUE("studentId", "courseId")
);

-- Indexes for Payment table
CREATE INDEX IF NOT EXISTS idx_payment_student ON "Payment"("studentId");
CREATE INDEX IF NOT EXISTS idx_payment_course ON "Payment"("courseId");
CREATE INDEX IF NOT EXISTS idx_payment_status ON "Payment"(status);

-- ============================================
-- QuizAttempt Table
-- ============================================
-- Tracks when students take a quiz
CREATE TABLE IF NOT EXISTS "QuizAttempt" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "studentId" VARCHAR(36) NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "quizId" VARCHAR(36) NOT NULL REFERENCES "Quiz"(id) ON DELETE CASCADE,
    score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,  -- Score as percentage (0-100)
    "isCorrect" BOOLEAN,  -- Legacy field for single-question quizzes
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for QuizAttempt table
CREATE INDEX IF NOT EXISTS idx_quizattempt_student ON "QuizAttempt"("studentId");
CREATE INDEX IF NOT EXISTS idx_quizattempt_quiz ON "QuizAttempt"("quizId");

-- ============================================
-- QuestionAttempt Table
-- ============================================
-- Tracks individual question responses within a quiz attempt
CREATE TABLE IF NOT EXISTS "QuestionAttempt" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "quizAttemptId" VARCHAR(36) NOT NULL REFERENCES "QuizAttempt"(id) ON DELETE CASCADE,
    "questionId" VARCHAR(36) NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE,
    "selectedAnswerId" VARCHAR(36) REFERENCES "Answer"(id) ON DELETE SET NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for QuestionAttempt table
CREATE INDEX IF NOT EXISTS idx_questionattempt_quizattempt ON "QuestionAttempt"("quizAttemptId");
CREATE INDEX IF NOT EXISTS idx_questionattempt_question ON "QuestionAttempt"("questionId");

-- ============================================
-- Announcement Table
-- ============================================
-- Public announcements posted by admins
CREATE TABLE IF NOT EXISTS "Announcement" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdById" VARCHAR(36) NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Announcement table
CREATE INDEX IF NOT EXISTS idx_announcement_created_at ON "Announcement"("createdAt" DESC);

-- ============================================
-- CourseMaterial Table (Optional)
-- ============================================
-- Stores additional course materials (zoom links, supplementary recordings)
CREATE TABLE IF NOT EXISTS "CourseMaterial" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "courseId" VARCHAR(36) NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
    "zoomLink" TEXT,
    "recordingUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- One material record per course
    UNIQUE("courseId")
);

-- ============================================
-- Updated At Trigger Function
-- ============================================
-- Automatically updates the "updatedAt" column on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Apply Updated At Triggers
-- ============================================
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_updated_at ON "Course";
CREATE TRIGGER update_course_updated_at
    BEFORE UPDATE ON "Course"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recording_updated_at ON "Recording";
CREATE TRIGGER update_recording_updated_at
    BEFORE UPDATE ON "Recording"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quiz_updated_at ON "Quiz";
CREATE TRIGGER update_quiz_updated_at
    BEFORE UPDATE ON "Quiz"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_question_updated_at ON "Question";
CREATE TRIGGER update_question_updated_at
    BEFORE UPDATE ON "Question"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_answer_updated_at ON "Answer";
CREATE TRIGGER update_answer_updated_at
    BEFORE UPDATE ON "Answer"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_updated_at ON "Payment";
CREATE TRIGGER update_payment_updated_at
    BEFORE UPDATE ON "Payment"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcement_updated_at ON "Announcement";
CREATE TRIGGER update_announcement_updated_at
    BEFORE UPDATE ON "Announcement"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coursematerial_updated_at ON "CourseMaterial";
CREATE TRIGGER update_coursematerial_updated_at
    BEFORE UPDATE ON "CourseMaterial"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Initial Admin User (IMPORTANT!)
-- ============================================
-- Creates a default admin user. Change the password immediately after setup!
-- Password: admin123 (bcrypt hash)
-- Generate new hash: https://bcrypt-generator.com/ or use bcrypt in Node.js
INSERT INTO "User" (id, email, name, password, role)
VALUES (
    uuid_generate_v4()::text,
    'admin@lms.com',
    'System Administrator',
    '$2b$10$rKN8VXnJvxCK5xYQH5Y5XOZxQFZmDhO.yGFfLXfQ5CJYSBvPL.XKa',  -- Password: admin123
    'ADMIN'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Useful Queries for Verification
-- ============================================
-- Run these after setup to verify everything is working:

-- Check all tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check admin user was created:
-- SELECT id, email, name, role FROM "User" WHERE role = 'ADMIN';

-- Check all indexes:
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

COMMENT ON TABLE "User" IS 'Stores all users (Admins, Instructors, Students)';
COMMENT ON TABLE "Course" IS 'Stores all courses created by admins/instructors';
COMMENT ON TABLE "Recording" IS 'Stores video recordings for courses';
COMMENT ON TABLE "Quiz" IS 'Quiz containers - each belongs to a course';
COMMENT ON TABLE "Question" IS 'Questions within quizzes';
COMMENT ON TABLE "Answer" IS 'Answer options for questions (typically 4 per question)';
COMMENT ON TABLE "Payment" IS 'Tracks student enrollment payments and approval status';
COMMENT ON TABLE "QuizAttempt" IS 'Records when students complete quizzes with their scores';
COMMENT ON TABLE "QuestionAttempt" IS 'Records individual question responses';
COMMENT ON TABLE "Announcement" IS 'Public announcements posted by admins';
COMMENT ON TABLE "CourseMaterial" IS 'Additional course materials like zoom links';

-- ============================================
-- Schema Complete!
-- ============================================
