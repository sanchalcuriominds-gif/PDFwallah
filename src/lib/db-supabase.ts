/**
 * Supabase-based Database Client
 * Replaces Prisma with Supabase JS client (HTTPS/REST API)
 * Works from Vercel serverless functions since it uses HTTPS instead of TCP
 *
 * This layer mimics Prisma's API shape to minimize changes in route handlers.
 * Unsupported features are handled with JavaScript fallbacks where possible.
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

// Helper: parse orderBy option into Supabase order calls
function applyOrderBy(query: any, orderBy?: any) {
  if (orderBy) {
    for (const [field, dir] of Object.entries(orderBy)) {
      query = query.order(field, { ascending: dir !== 'desc' });
    }
  }
  return query;
}

// Helper: apply where filters to a Supabase query
// Supports: eq, in, contains (via ilike), OR
function applyWhere(query: any, where?: any) {
  if (!where) return query;

  for (const [key, val] of Object.entries(where)) {
    if (val === undefined || val === null) continue;

    if (key === 'OR') {
      // PostgREST supports `or` filter: or(col1.ilike.%x%,col2.ilike.%x%)
      // Each condition in OR array: { field: { contains: value } } or { field: value }
      const orParts: string[] = [];
      for (const cond of val as any[]) {
        for (const [field, filter] of Object.entries(cond)) {
          if (typeof filter === 'object' && filter !== null) {
            if ((filter as any).contains !== undefined) {
              orParts.push(`${field}.ilike.%${(filter as any).contains}%`);
            }
          } else {
            orParts.push(`${field}.eq.${filter}`);
          }
        }
      }
      if (orParts.length > 0) {
        query = query.or(orParts.join(','));
      }
    } else if (key === 'id' && typeof val === 'object' && val !== null) {
      // Handle { id: { in: [...] } }
      if ((val as any).in) {
        query = query.in('id', (val as any).in);
      }
    } else if (typeof val === 'object' && val !== null) {
      // Handle { field: { contains: value } }
      if ((val as any).contains !== undefined) {
        query = query.ilike(key, `%${(val as any).contains}%`);
      } else if ((val as any).in) {
        query = query.in(key, (val as any).in);
      }
    } else {
      // Simple equality: { field: value }
      query = query.eq(key, val);
    }
  }

  return query;
}

// Helper: apply pagination (skip/take → range)
function applyPagination(query: any, options?: { skip?: number; take?: number; limit?: number }) {
  const limitVal = options?.take || options?.limit;
  if (options?.skip !== undefined && limitVal !== undefined) {
    const from = options.skip;
    const to = options.skip + limitVal - 1;
    query = query.range(from, to);
  } else if (limitVal !== undefined) {
    query = query.limit(limitVal);
  }
  return query;
}

// ========== Class ==========
export const classDb = {
  findMany: async (options?: { orderBy?: any; include?: any; where?: any }) => {
    const admin = getAdmin();
    let query = admin.from('Class').select('*');

    // Apply where filters
    if (options?.where) {
      query = applyWhere(query, options.where);
    }

    // Default ordering
    if (options?.orderBy) {
      query = applyOrderBy(query, options.orderBy);
    } else {
      query = query.order('sortOrder', { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Get counts separately if include._count is requested
    if (options?.include?._count) {
      const countSelects = options.include._count.select || {};
      const countFields = Object.keys(countSelects);

      const countMaps: Record<string, Record<string, number>> = {};

      // Build count maps for each requested relation
      for (const field of countFields) {
        const fkMap: Record<string, { table: string; fkColumn: string }> = {
          subjects: { table: 'Subject', fkColumn: 'classId' },
          pdfs: { table: 'Pdf', fkColumn: 'classId' },
        };

        const mapping = fkMap[field];
        if (mapping) {
          const { data: countData } = await admin.from(mapping.table).select(mapping.fkColumn);
          const map: Record<string, number> = {};
          (countData || []).forEach((item: any) => {
            const fk = item[mapping.fkColumn];
            map[fk] = (map[fk] || 0) + 1;
          });
          countMaps[field] = map;
        }
      }

      return (data || []).map((c: any) => ({
        ...c,
        _count: Object.fromEntries(
          countFields.map((field: string) => [field, countMaps[field]?.[c.id] || 0])
        ),
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
    // Handle increment: convert { salesCount: { increment: 1 } } to raw SQL-like increment
    const processedData = processUpdateData(options.data);
    const { data: result, error } = await admin
      .from('Class')
      .update({ ...processedData, updatedAt: new Date().toISOString() })
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

  count: async (options?: { where?: any }) => {
    const admin = getAdmin();
    let query = admin.from('Class').select('*', { count: 'exact', head: true });
    if (options?.where) {
      query = applyWhere(query, options.where);
    }
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count || 0;
  },
};

// Process update data: handle Prisma-style increment
function processUpdateData(data: any): any {
  const result: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'object' && val !== null && (val as any).increment !== undefined) {
      // For increment, we need to read current value and add
      // This is handled specially in the update methods that support it
      // Mark it so the update method knows to do a read-modify-write
      result[key] = val; // Will be handled in the specific update methods
    } else {
      result[key] = val;
    }
  }
  return result;
}

// ========== Subject ==========
export const subjectDb = {
  findMany: async (options?: { where?: any; orderBy?: any; include?: any }) => {
    const admin = getAdmin();

    // Determine what to select
    let selectFields = '*, class: Class(*)';
    let query = admin.from('Subject').select(selectFields);

    // Apply where filters
    if (options?.where) {
      query = applyWhere(query, options.where);
    }

    // Default ordering
    if (options?.orderBy) {
      query = applyOrderBy(query, options.orderBy);
    } else {
      query = query.order('name', { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Get counts separately if include._count is requested
    if (options?.include?._count) {
      const countSelects = options.include._count.select || {};
      const countFields = Object.keys(countSelects);

      const countMaps: Record<string, Record<string, number>> = {};

      for (const field of countFields) {
        const fkMap: Record<string, { table: string; fkColumn: string }> = {
          chapters: { table: 'Chapter', fkColumn: 'subjectId' },
          pdfs: { table: 'Pdf', fkColumn: 'subjectId' },
        };

        const mapping = fkMap[field];
        if (mapping) {
          const { data: countData } = await admin.from(mapping.table).select(mapping.fkColumn);
          const map: Record<string, number> = {};
          (countData || []).forEach((item: any) => {
            const fk = item[mapping.fkColumn];
            map[fk] = (map[fk] || 0) + 1;
          });
          countMaps[field] = map;
        }
      }

      return (data || []).map((s: any) => ({
        ...s,
        _count: Object.fromEntries(
          countFields.map((field: string) => [field, countMaps[field]?.[s.id] || 0])
        ),
      }));
    }

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
  findMany: async (options?: { where?: any; include?: any; orderBy?: any }) => {
    const admin = getAdmin();

    // Build select with nested includes
    let selectFields = '*, subject: Subject(*)';

    // Check for nested include: subject: { include: { class: true } }
    if (options?.include?.subject?.include?.class || options?.include?.subject === true) {
      selectFields = '*, subject: Subject(*, class: Class(*))';
    }

    let query = admin.from('Chapter').select(selectFields);

    // Apply where filters
    if (options?.where) {
      query = applyWhere(query, options.where);
    }

    if (options?.orderBy) {
      query = applyOrderBy(query, options.orderBy);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Get counts separately if include._count is requested
    if (options?.include?._count) {
      const countSelects = options.include._count.select || {};
      const countFields = Object.keys(countSelects);

      const countMaps: Record<string, Record<string, number>> = {};

      for (const field of countFields) {
        const fkMap: Record<string, { table: string; fkColumn: string }> = {
          topics: { table: 'Topic', fkColumn: 'chapterId' },
          pdfs: { table: 'Pdf', fkColumn: 'chapterId' },
        };

        const mapping = fkMap[field];
        if (mapping) {
          const { data: countData } = await admin.from(mapping.table).select(mapping.fkColumn);
          const map: Record<string, number> = {};
          (countData || []).forEach((item: any) => {
            const fk = item[mapping.fkColumn];
            map[fk] = (map[fk] || 0) + 1;
          });
          countMaps[field] = map;
        }
      }

      return (data || []).map((ch: any) => ({
        ...ch,
        _count: Object.fromEntries(
          countFields.map((field: string) => [field, countMaps[field]?.[ch.id] || 0])
        ),
      }));
    }

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
  findMany: async (options?: { where?: any; include?: any; orderBy?: any }) => {
    const admin = getAdmin();

    // Build select with nested includes
    // Default: just chapter
    // If include.chapter.include.subject.include.class: nested 3 levels
    let selectFields = '*, chapter: Chapter(*)';

    if (options?.include?.chapter?.include?.subject?.include?.class) {
      selectFields = '*, chapter: Chapter(*, subject: Subject(*, class: Class(*)))';
    } else if (options?.include?.chapter?.include?.subject) {
      selectFields = '*, chapter: Chapter(*, subject: Subject(*))';
    } else if (options?.include?.chapter) {
      selectFields = '*, chapter: Chapter(*)';
    }

    let query = admin.from('Topic').select(selectFields);

    // Apply where filters
    if (options?.where) {
      query = applyWhere(query, options.where);
    }

    if (options?.orderBy) {
      query = applyOrderBy(query, options.orderBy);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Get counts separately if include._count is requested
    if (options?.include?._count) {
      const countSelects = options.include._count.select || {};
      const countFields = Object.keys(countSelects);

      const countMaps: Record<string, Record<string, number>> = {};

      for (const field of countFields) {
        const fkMap: Record<string, { table: string; fkColumn: string }> = {
          pdfs: { table: 'Pdf', fkColumn: 'topicId' },
        };

        const mapping = fkMap[field];
        if (mapping) {
          const { data: countData } = await admin.from(mapping.table).select(mapping.fkColumn);
          const map: Record<string, number> = {};
          (countData || []).forEach((item: any) => {
            const fk = item[mapping.fkColumn];
            map[fk] = (map[fk] || 0) + 1;
          });
          countMaps[field] = map;
        }
      }

      return (data || []).map((tp: any) => ({
        ...tp,
        _count: Object.fromEntries(
          countFields.map((field: string) => [field, countMaps[field]?.[tp.id] || 0])
        ),
      }));
    }

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
    where?: any;
    orderBy?: any;
    limit?: number;
    take?: number;
    skip?: number;
    include?: any;
  }) => {
    const admin = getAdmin();
    let query = admin.from('Pdf').select('*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*)');

    // Apply where filters
    if (options?.where) {
      query = applyWhere(query, options.where);
    }

    // Ordering
    if (options?.orderBy) {
      query = applyOrderBy(query, options.orderBy);
    } else {
      query = query.order('createdAt', { ascending: false });
    }

    // Pagination: support both take/limit and skip
    query = applyPagination(query, { skip: options?.skip, take: options?.take, limit: options?.limit });

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Resolve noteType manually (no FK relationship in Supabase)
    const noteTypeIds = [...new Set((data || []).map((p: any) => p.noteTypeId).filter(Boolean))];
    let noteTypeMap: Record<string, any> = {};
    if (noteTypeIds.length > 0) {
      const { data: noteTypes } = await admin.from('NoteType').select('*').in('id', noteTypeIds);
      (noteTypes || []).forEach((nt: any) => { noteTypeMap[nt.id] = nt; });
    }
    const pdfsWithNoteType = (data || []).map((pdf: any) => ({
      ...pdf,
      noteType: pdf.noteTypeId ? (noteTypeMap[pdf.noteTypeId] || null) : null,
    }));

    // Get order counts if include._count is requested
    if (options?.include?._count?.select?.orders) {
      const { data: orderData } = await admin.from('Order').select('pdfId');
      const orderCountMap: Record<string, number> = {};
      (orderData || []).forEach((o: any) => {
        orderCountMap[o.pdfId] = (orderCountMap[o.pdfId] || 0) + 1;
      });

      return pdfsWithNoteType.map((pdf: any) => ({
        ...pdf,
        _count: {
          orders: orderCountMap[pdf.id] || 0,
        },
      }));
    }

    return pdfsWithNoteType;
  },

  findUnique: async (options: { where: { id: string }; include?: any }) => {
    const admin = getAdmin();

    // Build select with all needed relations
    let selectFields = '*';
    const includes: string[] = [];

    if (options.include?.class || options.include) {
      includes.push('class: Class(*)');
    }
    if (options.include?.subject || options.include) {
      includes.push('subject: Subject(*)');
    }
    if (options.include?.chapter || options.include) {
      includes.push('chapter: Chapter(*)');
    }
    if (options.include?.topic || options.include) {
      includes.push('topic: Topic(*)');
    }
    // noteType is resolved manually after query (no FK in Supabase)
    // if (options.include?.noteType || options.include) {
    //   includes.push('noteType: NoteType(*)');
    // }
    if (options.include?.orders) {
      includes.push('orders: Order(*)');
    }

    if (includes.length > 0) {
      selectFields = '*, ' + includes.join(', ');
    }

    const { data, error } = await admin.from('Pdf').select(selectFields).eq('id', options.where.id).single();
    if (error) return null;

    // Resolve noteType manually (no FK relationship in Supabase)
    if (data && data.noteTypeId) {
      const { data: noteType } = await admin.from('NoteType').select('*').eq('id', data.noteTypeId).single();
      data.noteType = noteType || null;
    } else if (data) {
      data.noteType = null;
    }

    // Rename 'orders' array to match Prisma convention if present
    if (data && data.orders && !data._count) {
      // If include.orders was requested, data.orders will be the array
      // This is fine - Prisma also returns it as an array
    }

    return data;
  },

  create: async (options: { data: any; include?: any }) => {
    const admin = getAdmin();
    const data = { id: generateId(), ...options.data };
    const { data: result, error } = await admin.from('Pdf').insert(data).select('*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*)').single();
    if (error) throw new Error(error.message);

    // Resolve noteType manually
    if (result && result.noteTypeId) {
      const { data: noteType } = await admin.from('NoteType').select('*').eq('id', result.noteTypeId).single();
      result.noteType = noteType || null;
    } else if (result) {
      result.noteType = null;
    }

    return result;
  },

  update: async (options: { where: { id: string }; data: any; include?: any }) => {
    const admin = getAdmin();

    // Handle increment: { salesCount: { increment: 1 } }
    // Need to read current value first, then set new value
    const incrementFields: Record<string, number> = {};
    const regularData: any = {};

    for (const [key, val] of Object.entries(options.data)) {
      if (typeof val === 'object' && val !== null && (val as any).increment !== undefined) {
        incrementFields[key] = (val as any).increment;
      } else {
        regularData[key] = val;
      }
    }

    // If there are increment fields, read current values first
    if (Object.keys(incrementFields).length > 0) {
      const { data: current } = await admin.from('Pdf').select('*').eq('id', options.where.id).single();
      if (current) {
        for (const [field, inc] of Object.entries(incrementFields)) {
          regularData[field] = (Number((current as any)[field]) || 0) + inc;
        }
      }
    }

    const { data: result, error } = await admin
      .from('Pdf')
      .update({ ...regularData, updatedAt: new Date().toISOString() })
      .eq('id', options.where.id)
      .select('*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*)')
      .single();
    if (error) throw new Error(error.message);

    // Resolve noteType manually
    if (result && result.noteTypeId) {
      const { data: noteType } = await admin.from('NoteType').select('*').eq('id', result.noteTypeId).single();
      result.noteType = noteType || null;
    } else if (result) {
      result.noteType = null;
    }

    return result;
  },

  delete: async (options: { where: { id: string } }) => {
    const admin = getAdmin();
    const { error } = await admin.from('Pdf').delete().eq('id', options.where.id);
    if (error) throw new Error(error.message);
  },

  count: async (options?: { where?: any }) => {
    const admin = getAdmin();
    let query = admin.from('Pdf').select('*', { count: 'exact', head: true });
    if (options?.where) {
      query = applyWhere(query, options.where);
    }
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count || 0;
  },
};

// ========== Order ==========
export const orderDb = {
  findUnique: async (options: { where: { id?: string; downloadToken?: string }; include?: any }) => {
    const admin = getAdmin();

    // Determine select fields based on include
    let selectFields = '*';
    if (options.include?.pdf) {
      selectFields = '*, pdf: Pdf(*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*))';
    }

    let query = admin.from('Order').select(selectFields);

    if (options.where.id) query = query.eq('id', options.where.id);
    if (options.where.downloadToken) query = query.eq('downloadToken', options.where.downloadToken);

    const { data, error } = await query.single();
    if (error) return null;

    // If include.pdf.select was specified, filter the pdf fields
    if (data && options.include?.pdf?.select) {
      const selectFields2 = Object.keys(options.include.pdf.select);
      const filteredPdf: any = {};
      for (const field of selectFields2) {
        if (data.pdf && data.pdf[field] !== undefined) {
          filteredPdf[field] = data.pdf[field];
        }
      }
      data.pdf = filteredPdf;
    }

    return data;
  },

  findFirst: async (options?: { where?: any; orderBy?: any; include?: any }) => {
    const admin = getAdmin();

    // Determine select fields based on include
    let selectFields = '*, pdf: Pdf(*)';
    if (options?.include?.pdf) {
      selectFields = '*, pdf: Pdf(*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*))';
    }

    let query = admin.from('Order').select(selectFields);

    if (options?.where) {
      query = applyWhere(query, options.where);
    }

    if (options?.orderBy) {
      query = applyOrderBy(query, options.orderBy);
    }

    // findFirst returns at most 1 result
    query = query.limit(1);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Return the first item or null
    if (!data || data.length === 0) return null;

    // If include.pdf.select was specified, filter the pdf fields
    const result = data[0];
    if (options?.include?.pdf?.select && result.pdf) {
      const selectFields2 = Object.keys(options.include.pdf.select);
      const filteredPdf: any = {};
      for (const field of selectFields2) {
        if (result.pdf[field] !== undefined) {
          filteredPdf[field] = result.pdf[field];
        }
      }
      result.pdf = filteredPdf;
    }

    return result;
  },

  findMany: async (options?: { where?: any; orderBy?: any; limit?: number; take?: number; include?: any }) => {
    const admin = getAdmin();

    // Determine select fields based on include
    let selectFields = '*, pdf: Pdf(*)';
    if (options?.include?.pdf) {
      selectFields = '*, pdf: Pdf(*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*))';
    }

    let query = admin.from('Order').select(selectFields);

    if (options?.where) {
      query = applyWhere(query, options.where);
    }

    if (options?.orderBy) {
      query = applyOrderBy(query, options.orderBy);
    }

    // Support both take and limit
    const limitVal = options?.take || options?.limit;
    if (limitVal) query = query.limit(limitVal);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // If include.pdf.select was specified, filter the pdf fields in each order
    if (options?.include?.pdf?.select) {
      const selectFields2 = Object.keys(options.include.pdf.select);
      return (data || []).map((order: any) => {
        if (order.pdf) {
          const filteredPdf: any = {};
          for (const field of selectFields2) {
            if (order.pdf[field] !== undefined) {
              filteredPdf[field] = order.pdf[field];
            }
          }
          return { ...order, pdf: filteredPdf };
        }
        return order;
      });
    }

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

    let selectFields = '*';
    if (options.include?.pdf) {
      selectFields = '*, pdf: Pdf(*, class: Class(*), subject: Subject(*), chapter: Chapter(*), topic: Topic(*))';
    }

    const { data: result, error } = await admin
      .from('Order')
      .update({ ...options.data, updatedAt: new Date().toISOString() })
      .eq('id', options.where.id)
      .select(selectFields)
      .single();
    if (error) throw new Error(error.message);
    return result;
  },

  count: async (options?: { where?: any }) => {
    const admin = getAdmin();
    let query = admin.from('Order').select('*', { count: 'exact', head: true });
    if (options?.where) {
      query = applyWhere(query, options.where);
    }
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count || 0;
  },

  // Aggregate method - sums up fields (mimics Prisma's aggregate)
  aggregate: async (options?: { where?: any; _sum?: Record<string, boolean> }) => {
    const admin = getAdmin();

    // Fetch the fields we need to sum
    const sumFields = options?._sum ? Object.keys(options._sum) : [];
    const selectStr = sumFields.length > 0 ? sumFields.join(', ') : 'amount';

    let query = admin.from('Order').select(selectStr);
    if (options?.where) {
      query = applyWhere(query, options.where);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Calculate sums in JavaScript
    const result: any = { _sum: {} };
    for (const field of sumFields) {
      result._sum[field] = (data || []).reduce((sum: number, item: any) => {
        return sum + (Number(item[field]) || 0);
      }, 0);
    }

    return result;
  },
};

// ========== NoteType ==========
export const noteTypeDb = {
  findMany: async (options?: { where?: any; orderBy?: any }) => {
    const admin = getAdmin();
    let query = admin.from('NoteType').select('*');

    if (options?.where) {
      query = applyWhere(query, options.where);
    }

    if (options?.orderBy) {
      query = applyOrderBy(query, options.orderBy);
    } else {
      query = query.order('name', { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  findUnique: async (options: { where: { id?: string; slug?: string } }) => {
    const admin = getAdmin();
    let query = admin.from('NoteType').select('*');

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
    const { data: result, error } = await admin.from('NoteType').insert(data).select().single();
    if (error) throw new Error(error.message);
    return result;
  },

  update: async (options: { where: { id: string }; data: any }) => {
    const admin = getAdmin();
    const { data: result, error } = await admin
      .from('NoteType')
      .update({ ...options.data, updatedAt: new Date().toISOString() })
      .eq('id', options.where.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  },

  delete: async (options: { where: { id: string } }) => {
    const admin = getAdmin();
    const { error } = await admin.from('NoteType').delete().eq('id', options.where.id);
    if (error) throw new Error(error.message);
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

// ========== NoteRequest ==========
export const noteRequestDb = {
  create: async (options: { data: any }) => {
    const admin = getAdmin();
    const data = { id: generateId(), ...options.data, createdAt: new Date().toISOString() };
    const { data: result, error } = await admin.from('NoteRequest').insert(data).select().single();
    if (error) throw new Error(error.message);
    return result;
  },

  findMany: async (options?: { where?: any; orderBy?: any; limit?: number }) => {
    const admin = getAdmin();
    let query = admin.from('NoteRequest').select('*');

    if (options?.where) {
      query = applyWhere(query, options.where);
    }

    if (options?.orderBy) {
      query = applyOrderBy(query, options.orderBy);
    } else {
      query = query.order('createdAt', { ascending: false });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },
};

// Export a combined db object that mimics Prisma's API shape
export const db = {
  class: classDb,
  subject: subjectDb,
  chapter: chapterDb,
  topic: topicDb,
  noteType: noteTypeDb,
  pdf: pdfDb,
  order: orderDb,
  adminSession: adminSessionDb,
  noteRequest: noteRequestDb,
};

// Default export for convenience
export default db;
