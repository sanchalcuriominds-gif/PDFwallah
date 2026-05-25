/*
 * SQL to create the NoteRequest table in Supabase:
 *
 * CREATE TABLE "NoteRequest" (
 *   "id" TEXT PRIMARY KEY,
 *   "name" TEXT NOT NULL,
 *   "email" TEXT NOT NULL,
 *   "notes" TEXT NOT NULL,
 *   "examClass" TEXT,
 *   "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 *
 * -- Enable RLS (Row Level Security)
 * ALTER TABLE "NoteRequest" ENABLE ROW LEVEL SECURITY;
 *
 * -- Allow inserts from authenticated and anon users
 * CREATE POLICY "Allow inserts" ON "NoteRequest" FOR INSERT WITH CHECK (true);
 *
 * -- Allow reads only for service role (admin)
 * CREATE POLICY "Allow reads for service role" ON "NoteRequest" FOR SELECT USING (auth.role() = 'service_role');
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, notes, examClass } = body

    if (!name || !email || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, and notes are required.' },
        { status: 400 }
      )
    }

    const noteRequest = await db.noteRequest.create({
      data: {
        name,
        email,
        notes,
        examClass: examClass || null,
      },
    })

    return NextResponse.json({ success: true, id: noteRequest.id })
  } catch (error) {
    console.error('Error saving note request:', error)
    return NextResponse.json(
      { error: 'Failed to save request. Please try again later.' },
      { status: 500 }
    )
  }
}
