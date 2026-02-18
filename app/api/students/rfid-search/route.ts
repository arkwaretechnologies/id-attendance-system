import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'auth_session';
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing AUTH_SECRET or JWT_SECRET');
  return new TextEncoder().encode(secret);
}

async function getSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as {
      user_id?: number;
      role?: string;
      school_id?: number | null;
    };
  } catch {
    return null;
  }
}

/** GET: cursor-based pagination for RFID search. Returns students, next_cursor, has_more. */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const schoolId = session.school_id ?? null;
    if (schoolId == null) {
      return NextResponse.json({ error: 'Missing school_id in session' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const schoolYear = searchParams.get('schoolYear') || '';
    const gradeLevel = searchParams.get('gradeLevel') || '';
    const cursor = searchParams.get('cursor') || '';
    const limitParam = searchParams.get('limit');
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(limitParam) || DEFAULT_PAGE_SIZE)
    );

    const supabase = createServerSupabase();
    let query = supabase
      .from('student_profile')
      .select(
        'id, learner_reference_number, last_name, first_name, middle_name, extension_name, school_year, grade_level, rfid_tag'
      )
      .eq('school_id', schoolId)
      .order('id', { ascending: true });

    if (search.trim()) {
      const safe = search.trim().replace(/,/g, ' ');
      const term = `%${safe}%`;
      query = query.or(
        `last_name.ilike.${term},first_name.ilike.${term},learner_reference_number.ilike.${term}`
      );
    }
    if (schoolYear) query = query.eq('school_year', schoolYear);
    if (gradeLevel) query = query.eq('grade_level', gradeLevel);

    if (cursor) {
      query = query.gt('id', cursor);
    }

    const { data, error } = await query.limit(limit + 1);

    if (error) {
      console.error('RFID search error:', error);
      return NextResponse.json({ error: 'Failed to search students' }, { status: 500 });
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const students = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore && students.length > 0
      ? (students[students.length - 1] as { id: string }).id
      : null;

    return NextResponse.json({
      students,
      next_cursor: nextCursor,
      has_more: hasMore,
    });
  } catch (err) {
    console.error('RFID search internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
