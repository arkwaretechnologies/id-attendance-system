import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'auth_session';

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

/** GET: list students from public.student_profile scoped by session.school_id. */
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
    const schoolYear = searchParams.get('schoolYear') || '';
    const gradeLevel = searchParams.get('gradeLevel') || '';
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '20');

    const supabase = createServerSupabase();
    let query = supabase
      .from('student_profile')
      .select(
        'id, learner_reference_number, last_name, first_name, middle_name, extension_name, sex, school_year, grade_level, rfid_tag, school_id',
        { count: 'exact' }
      )
      .eq('school_id', schoolId)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (schoolYear) query = query.eq('school_year', schoolYear);
    if (gradeLevel) query = query.eq('grade_level', gradeLevel);

    if (Number.isFinite(page) && Number.isFinite(pageSize) && pageSize > 0) {
      const from = Math.max(0, (page - 1) * pageSize);
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) {
      console.error('Students GET error:', error);
      return NextResponse.json({ error: 'Failed to load students' }, { status: 500 });
    }

    return NextResponse.json({
      students: data ?? [],
      count: count ?? 0,
    });
  } catch (err) {
    console.error('Students GET internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST: create a student. Uses service role so RLS does not block insert. */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const schoolId = session.school_id ?? null;
    if (schoolId == null) {
      return NextResponse.json({ error: 'Missing school_id in session' }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const insertData = {
      ...body,
      school_id: schoolId,
    };

    const { data, error } = await supabase
      .from('student_profile')
      .insert([insertData] as never)
      .select()
      .single();

    if (error) {
      console.error('Students POST error:', error);
      return NextResponse.json({ error: error.message ?? 'Failed to create student' }, { status: 500 });
    }
    return NextResponse.json({ student: data });
  } catch (err) {
    console.error('Students POST internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

