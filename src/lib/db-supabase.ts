/**
 * Supabase-based Database Client
 * Replaces Prisma with Supabase JS client (HTTPS/REST API)
 * Works from Vercel serverless functions since it uses HTTPS instead of TCP
 */
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';
import { v4 as uuidv4 } from 'uuid';

function getAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  return getSupabaseAdmin();
}

// Generate CUID-like IDs (compatible with existing data)
function generateId(): string {
  return uuidv4();
}

// ========== Class ==========
export const classDb = {
  findMany: async (options?: { orderBy?: { sortOrder: 'asc' | 'desc' }; include?: any }) => {
    const admin = getAdmin();
    let query = admin.from('Class').select(options?.include ? '*, _count: { select: { subjects: true, pdfs: true } }' : '*');
    
    // Supabase doesn't support _count directly, so we do it differently
    query = admin.from('Class').select('*');
    
    const { data, error } = await query.order('sortOrder', { ascending: (options?.orderBy as any)?.sortOrder !== 'desc' });
    if (error) throw new Error(error.message);
    
    // Get counts separately
    if (options?.include) {
      const subjectsCount = await admin.from('Subject').select('classId');
      const pdfsCount = await admin.from('Pdf').select('classId');
      
      const subjectMap: Record<string, number> = {};
      const pdfMap: Record<string, number> = {};
      
      (subjectsCount.data || []).forEach((s: any) => {
        subjectMap[s.classId] = (subjectMap[s.classId] || 0) + 1;
      });
      (pdfsCount.data || []).forEach((p: any) => {
        pdfMap[p.classId] = (pdfMap[p.classId] || 0) + 1;
      });
      
      return (data || []).map((c: any) => ({
        ...c,
        _count: {
          subjects: subjectMap[c.id] || 0,
          pdfs: pdfMap[c.id] || 0,
        }
      }));
    }
    
    return data || [];
  },

  findUnique: async (options: { where: { id?: string; slug?: string } }) => {
    const admin = getAdmin();
    let query = admin.from('Class').select('*');
    
    if (options.where.id) {
      query = query.eq('id', options.where.id);
    } else if (options.where.slug) {
      query = query.eq('slug', options.where.slug);
    }
    
    const { data, error } = await query.single();
    if (error) return null;
    return data;
  },

  create: async (options: { data: any }) => {
    const admin = getAdmin();
    const data = { id: generateId(), ...options.data };
    const { data: result, error } = await admin.from('Class').insert(data).select().single();
    if (error) throw new Error(error.message);
    return result;
  },

  update: async (options: { where: { id: string }; data: any }) => {
    const admin = getAdmin();
    const { data: result, error } = await admin
      .from('Class')
      .update({ ...options.data, updatedAt: new Date().toISOString() })
      .eq('id', options.where.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  },

  delete: async (options: { where: { id: string } }) => {
    const admin = getAdmin();
    const { error } = await admin.from('Class').delete().eq('id', options.where.id);
    if (error) throw new Error(error.message);
  },

  count: async () => {
    const admin = getAdmin();
    const { count, error } = await admin.from('Class').select('*', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    return count || 0;
  },
};

// ========== Subject ==========
export const subjectDb = {
  findMany: async (options?: { where?: { classId?: string }; orderBy?: any }) => {
    const admin = getAdmin();
    let query = admin.from('Subject').select('*, class: Class(*)');
    
    if (options?.where?.classId) {
      query = query.eq('classId', options.where.classId);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  findUnique: async (options: { where: { id: string } }) => {
    const admin = getAdmin();
    const { data, error } = await admin.from('Subject').select('*, class: Class(*)').eq('id', options.where.id).single();
    if (error) return null;
    return data;
  },

  create: async (options: { data: any }) => {
    const admin = getAdmin();
    const data = { id: generateId(), ...options.data };
    const { data: result, error } = await admin.from('Subject').insert(data).select().single();
    if (error) throw new Error(error.message);
    return result;
  },

  update: async (options: { where: { id: string }; data: any }) => {
    const admin = getAdmin();
    const { data: result, error } = await admin
      .from('Subject')
      .update({ ...options.data, updatedAt: new Date().toISOString() })
      .eq('id', options.where.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  },

  delete: async (options: { where: { id: string } }) => {
    const admin = getAdmin();
    const { error } = await admin.from('Subject').delete().eq('id', options.where.id);
    if (error) throw new Error(error.message);
  },
};

// ========== Chapter ==========
export const chapterDb = {
  findMany: async (options?: { where?: { subjectId?: string } }) => {
    const admin = getAdmin();
    let query = admin.from('Chapter').select('*, subject: Subject(*)');
    if (options?.where?.subjectId) {
      query = query.eq('subjectId', options.where.subjectId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  findUnique: async (options: { where: { id: string } }) => {
    const admin = getAdmin();
    const { data, error } = await admin.from('Chapter').select('*').eq('id', options.where.id).single();
    if (error) return null;
    return data;
  },

  create: async (options: { data: any }) => {
    const admin = getAdmin();
    const data = { id: generateId(), ...options.data };
    const { data: result, error } = await admin.from('Chapter').insert(data).select().single();
    if (error) throw new Error(error.message);
    return result;
  },

  update: async (options: { where: { id: string }; data: any }) => {
    const admin = getAdmin();
    const { data: result, error } = await admin
      .from('Chapter')
      .update({ ...options.data, updatedAt: new Date().toISOString() })
      .eq('id', options.where.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  },

  delete: async (options: { where: { id: string } }) => {
    const admin = getAdmin();
    const { error } = await admin.from('Chapter').delete().eq('id', options.where.id);
    if (error) throw new Error(error.message);
  },
};

// ========== Topic ==========
export const topicDb = {
  findMany: async (options?: { where?: { chapterId?: string } }) => {
    const admin = getAdmin();
    let query = admin.from('Topic').select('*, chapter: Chapter(*)');
    if (options?.where?.chapterId) {
      query = query.eq('chapterId', options.where.chapterId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  findUnique: async (options: { where: { id: string } }) => {
    const admin = getAdmin();
    const { data, error } = await admin.from('Topic').select('*').eq('id', options.where.id).single();
    if (error) return null;
    return data;
  },

  create: async (options: { data: any }) => {
    const admin = getAdmin();
    const data = { id: generateId(), ...options.data };
    const { data: result, error } = await admin.from('Topic').insert(data).select().single();
    if (error) throw new Error(error.message);
    return result;
  },

  update: async (options: { where: { id: string }; data: any }) => {
    const admin = getAdmin();
    const { data: result, error } = await admin
      .from('Topic')
      .update({ ...options.data, updatedAt: new Date().toISOString() })
      .eq('id', options.where.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  },

  delete: async (options: { where: { id: string } }) => {
    const admin = getAdmin();
    const { error } = await admin.from('Topic').delete().eq('id', options.where.id);
    if (error) throw new Error(error.message);
  },
};

// ========== Pdf ==========
export const pdfDb = {
  findMany: async (options?: {
    where?: { published?: boolean; featured?: boolean; classId?: string; subjectId?: string; chapterId?: string; topicId?: string; id?: { in?: string[] } };
    orderBy?: any;
    limit?: number;
    include?: any;
  }) => {
    const admin = getAdmin();
    let query = admin.from('Pdf').select('*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*)');
    
    if (options?.where?.published !== undefined) query = query.eq('published', options.where.published);
    if (options?.where?.featured !== undefined) query = query.eq('featured', options.where.featured);
    if (options?.where?.classId) query = query.eq('classId', options.where.classId);
    if (options?.where?.subjectId) query = query.eq('subjectId', options.where.subjectId);
    if (options?.where?.chapterId) query = query.eq('chapterId', options.where.chapterId);
    if (options?.where?.topicId) query = query.eq('topicId', options.where.topicId);
    if (options?.where?.id?.in) query = query.in('id', options.where.id.in);
    
    // Ordering
    if (options?.orderBy) {
      for (const [field, dir] of Object.entries(options.orderBy)) {
        query = query.order(field, { ascending: dir !== 'desc' });
      }
    } else {
      query = query.order('createdAt', { ascending: false });
    }
    
    if (options?.limit) query = query.limit(options.limit);
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  findUnique: async (options: { where: { id: string }; include?: any }) => {
    const admin = getAdmin();
    const selectFields = options.include 
      ? '*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*)'
      : '*';
    
    const { data, error } = await admin.from('Pdf').select(selectFields).eq('id', options.where.id).single();
    if (error) return null;
    return data;
  },

  create: async (options: { data: any; include?: any }) => {
    const admin = getAdmin();
    const data = { id: generateId(), ...options.data };
    const { data: result, error } = await admin.from('Pdf').insert(data).select('*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*)').single();
    if (error) throw new Error(error.message);
    return result;
  },

  update: async (options: { where: { id: string }; data: any; include?: any }) => {
    const admin = getAdmin();
    const { data: result, error } = await admin
      .from('Pdf')
      .update({ ...options.data, updatedAt: new Date().toISOString() })
      .eq('id', options.where.id)
      .select('*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*)')
      .single();
    if (error) throw new Error(error.message);
    return result;
  },

  delete: async (options: { where: { id: string } }) => {
    const admin = getAdmin();
    const { error } = await admin.from('Pdf').delete().eq('id', options.where.id);
    if (error) throw new Error(error.message);
  },

  count: async (options?: { where?: { published?: boolean } }) => {
    const admin = getAdmin();
    let query = admin.from('Pdf').select('*', { count: 'exact', head: true });
    if (options?.where?.published !== undefined) query = query.eq('published', options.where.published);
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count || 0;
  },
};

// ========== Order ==========
export const orderDb = {
  findUnique: async (options: { where: { id?: string; downloadToken?: string }; include?: any }) => {
    const admin = getAdmin();
    const selectFields = options.include?.pdf 
      ? '*, pdf: Pdf(*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*))'
      : '*';
    
    let query = admin.from('Order').select(selectFields);
    
    if (options.where.id) query = query.eq('id', options.where.id);
    if (options.where.downloadToken) query = query.eq('downloadToken', options.where.downloadToken);
    
    const { data, error } = await query.single();
    if (error) return null;
    return data;
  },

  findMany: async (options?: { where?: { status?: string; pdfId?: string }; orderBy?: any; limit?: number }) => {
    const admin = getAdmin();
    let query = admin.from('Order').select('*, pdf: Pdf(*)');
    
    if (options?.where?.status) query = query.eq('status', options.where.status);
    if (options?.where?.pdfId) query = query.eq('pdfId', options.where.pdfId);
    
    if (options?.orderBy) {
      for (const [field, dir] of Object.entries(options.orderBy)) {
        query = query.order(field, { ascending: dir !== 'desc' });
      }
    }
    
    if (options?.limit) query = query.limit(options.limit);
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  create: async (options: { data: any }) => {
    const admin = getAdmin();
    const data = { id: generateId(), ...options.data };
    const { data: result, error } = await admin.from('Order').insert(data).select().single();
    if (error) throw new Error(error.message);
    return result;
  },

  update: async (options: { where: { id: string }; data: any; include?: any }) => {
    const admin = getAdmin();
    const selectFields = options.include?.pdf
      ? '*, pdf: Pdf(*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*))'
      : '*';
    
    const { data: result, error } = await admin
      .from('Order')
      .update({ ...options.data, updatedAt: new Date().toISOString() })
      .eq('id', options.where.id)
      .select(selectFields)
      .single();
    if (error) throw new Error(error.message);
    return result;
  },

  count: async (options?: { where?: { status?: string } }) => {
    const admin = getAdmin();
    let query = admin.from('Order').select('*', { count: 'exact', head: true });
    if (options?.where?.status) query = query.eq('status', options.where.status);
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count || 0;
  },
};

// ========== AdminSession ==========
export const adminSessionDb = {
  findUnique: async (options: { where: { token: string } }) => {
    const admin = getAdmin();
    const { data, error } = await admin.from('AdminSession').select('*').eq('token', options.where.token).single();
    if (error) return null;
    return data;
  },

  create: async (options: { data: any }) => {
    const admin = getAdmin();
    const data = { id: generateId(), ...options.data };
    const { data: result, error } = await admin.from('AdminSession').insert(data).select().single();
    if (error) throw new Error(error.message);
    return result;
  },

  delete: async (options: { where: { token: string } }) => {
    const admin = getAdmin();
    const { error } = await admin.from('AdminSession').delete().eq('token', options.where.token);
    if (error) throw new Error(error.message);
  },
};

// Export a combined db object that mimics Prisma's API shape
export const db = {
  class: classDb,
  subject: subjectDb,
  chapter: chapterDb,
  topic: topicDb,
  pdf: pdfDb,
  order: orderDb,
  adminSession: adminSessionDb,
};

// Default export for convenience
export default db;
