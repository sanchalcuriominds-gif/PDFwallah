-- =============================================
-- VEDANT ACADEMY - Database Schema for Supabase
-- =============================================
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Paste this entire script and click "Run"

-- 1. Classes table
CREATE TABLE IF NOT EXISTS "Class" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "slug" TEXT NOT NULL UNIQUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 2. Subjects table
CREATE TABLE IF NOT EXISTS "Subject" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "classId" TEXT NOT NULL REFERENCES "Class"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("classId", "slug")
);

-- 3. Chapters table
CREATE TABLE IF NOT EXISTS "Chapter" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL REFERENCES "Subject"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("subjectId", "slug")
);

-- 4. Topics table
CREATE TABLE IF NOT EXISTS "Topic" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "chapterId" TEXT NOT NULL REFERENCES "Chapter"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("chapterId", "slug")
);

-- 5. PDFs table
CREATE TABLE IF NOT EXISTS "Pdf" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "thumbnailPath" TEXT,
  "previewFilePath" TEXT,
  "previewFileUrl" TEXT,
  "fullFilePath" TEXT,
  "fullFileUrl" TEXT,
  "pdfPath" TEXT NOT NULL DEFAULT 'pdfs/placeholder.pdf',
  "pageCount" INTEGER NOT NULL DEFAULT 0,
  "previewPageCount" INTEGER NOT NULL DEFAULT 0,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "downloadCount" INTEGER NOT NULL DEFAULT 0,
  "salesCount" INTEGER NOT NULL DEFAULT 0,
  "fileSize" INTEGER NOT NULL DEFAULT 0,
  "classId" TEXT NOT NULL REFERENCES "Class"("id"),
  "subjectId" TEXT NOT NULL REFERENCES "Subject"("id"),
  "chapterId" TEXT NOT NULL REFERENCES "Chapter"("id"),
  "topicId" TEXT NOT NULL REFERENCES "Topic"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 6. Orders table
CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT PRIMARY KEY,
  "razorpayOrderId" TEXT,
  "razorpayPaymentId" TEXT,
  "razorpaySignature" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" TEXT NOT NULL DEFAULT 'created',
  "pdfId" TEXT NOT NULL REFERENCES "Pdf"("id"),
  "downloadToken" TEXT,
  "tokenExpiry" TIMESTAMP,
  "watermarkText" TEXT,
  "buyerEmail" TEXT,
  "buyerPhone" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 7. Admin Sessions table
CREATE TABLE IF NOT EXISTS "AdminSession" (
  "id" TEXT PRIMARY KEY,
  "token" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Pdf_classId_idx" ON "Pdf"("classId");
CREATE INDEX IF NOT EXISTS "Pdf_subjectId_idx" ON "Pdf"("subjectId");
CREATE INDEX IF NOT EXISTS "Pdf_chapterId_idx" ON "Pdf"("chapterId");
CREATE INDEX IF NOT EXISTS "Pdf_topicId_idx" ON "Pdf"("topicId");
CREATE INDEX IF NOT EXISTS "Pdf_published_idx" ON "Pdf"("published");
CREATE INDEX IF NOT EXISTS "Pdf_featured_idx" ON "Pdf"("featured");
CREATE INDEX IF NOT EXISTS "Order_pdfId_idx" ON "Order"("pdfId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_downloadToken_idx" ON "Order"("downloadToken");
CREATE INDEX IF NOT EXISTS "Subject_classId_idx" ON "Subject"("classId");
CREATE INDEX IF NOT EXISTS "Chapter_subjectId_idx" ON "Chapter"("subjectId");
CREATE INDEX IF NOT EXISTS "Topic_chapterId_idx" ON "Topic"("chapterId");

-- Disable RLS so Prisma with service_role can access everything directly
-- Our app handles access control in the API routes
ALTER TABLE "Class" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Subject" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Chapter" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Topic" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Pdf" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminSession" DISABLE ROW LEVEL SECURITY;

-- =============================================
-- DONE! All tables created with indexes.
-- Now go back and tell me "done"!
-- =============================================
