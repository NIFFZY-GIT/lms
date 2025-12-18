-- Add term column to PastPaper table
ALTER TABLE "PastPaper" ADD COLUMN IF NOT EXISTS term VARCHAR(50) NOT NULL DEFAULT '1st Term';
CREATE INDEX IF NOT EXISTS idx_pastpaper_term ON "PastPaper"(term);
