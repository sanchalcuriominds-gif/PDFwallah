import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Public client (for frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client with service role (for backend - bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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
  try {
    const { data, error } = await supabaseAdmin.storage
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
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

// Get a signed (temporary) URL for a private file
export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 60 // seconds
): Promise<{ url: string; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin.storage
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
  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath])
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
  return !!(supabaseUrl && supabaseServiceKey)
}
