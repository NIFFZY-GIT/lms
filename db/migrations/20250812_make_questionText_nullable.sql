-- Migration: allow null questionText so image-only questions can be created

ALTER TABLE "Question"
ALTER COLUMN "questionText" DROP NOT NULL;
