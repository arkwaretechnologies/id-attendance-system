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
      school_id?: number | null;
    };
  } catch {
    return null;
  }
}

/** GET: list attendance with student_profile. Uses service role so RLS does not block. Optional school scope. */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const schoolId = session.school_id ?? null;
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('attendance')
      .select('*, student_profile (*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Attendance GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }

    let list = data ?? [];

    if (schoolId != null) {
      list = list.filter(
        (row: { student_profile?: { school_id?: number | null } | null }) =>
          row.student_profile?.school_id === schoolId
      );
    } else {
      list = list.filter(
        (row: { student_profile?: { school_id?: number | null } | null }) =>
          row.student_profile?.school_id == null
      );
    }

    return NextResponse.json({ attendance: list });
  } catch (err) {
    console.error('Attendance GET internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
