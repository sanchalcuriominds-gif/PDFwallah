// Watermark utility for PDF files
import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'upload');

export function getPdfFilePath(pdfPath: string): string {
  return path.join(UPLOAD_DIR, pdfPath);
}

export function getThumbnailFilePath(thumbnailPath: string): string {
  return path.join(UPLOAD_DIR, thumbnailPath);
}

export function ensureUploadDirs(): void {
  const pdfsDir = path.join(UPLOAD_DIR, 'pdfs');
  const thumbsDir = path.join(UPLOAD_DIR, 'thumbnails');
  
  if (!fs.existsSync(pdfsDir)) {
    fs.mkdirSync(pdfsDir, { recursive: true });
  }
  if (!fs.existsSync(thumbsDir)) {
    fs.mkdirSync(thumbsDir, { recursive: true });
  }
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function getFileSize(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
