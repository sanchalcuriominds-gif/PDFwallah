import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Lazy-initialized clients - only created when actually needed
let _supabaseAdmin: SupabaseClient | null = null

// Admin client with service role (for backend - bypasses RLS) - lazy init
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin && isSupabaseConfigured()) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  }
  if (!_supabaseAdmin) {
    // Return a dummy client that won't crash - methods will check isSupabaseConfigured first
    _supabaseAdmin = createClient('https://placeholder.supabase.co', 'placeholder-key')
  }
  return _supabaseAdmin
}

// Storage bucket names
export const PDF_BUCKET = 'pdfs'
export const THUMBNAIL_BUCKET = 'thumbnails'

// Upload a file to Supabase Storage
export async function uploadFile(
  bucket: string,
  filePath: string,
  file: File | Buffer | ArrayBuffer,
  contentType: string = 'application/pdf'
): Promise<{ path: string; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { path: '', error: 'Supabase not configured' }
  }

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType,
        upsert: true,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return { path: '', error: error.message }
    }

    return { path: data.path, error: null }
  } catch (err) {
    console.error('Upload exception:', err)
    return { path: '', error: 'Upload failed' }
  }
}

// Get a public URL for a file
export function getPublicUrl(bucket: string, filePath: string): string {
  if (!isSupabaseConfigured()) return ''
  const admin = getSupabaseAdmin()
  const { data } = admin.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

// Get a signed (temporary) URL for a private file
export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 60 // seconds
): Promise<{ url: string; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { url: '', error: 'Supabase not configured' }
  }

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      return { url: '', error: error.message }
    }

    return { url: data.signedUrl, error: null }
  } catch (err) {
    return { url: '', error: 'Failed to generate download URL' }
  }
}

// Delete a file from Supabase Storage
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase not configured' }
  }

  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin.storage.from(bucket).remove([filePath])
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  } catch (err) {
    return { error: 'Delete failed' }
  }
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceKey && supabaseUrl !== '' && supabaseUrl !== 'https://placeholder.supabase.co')
}
