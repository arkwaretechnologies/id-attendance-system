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

/** GET: distinct school years and grade levels scoped by session.school_id. */
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

    const supabase = createServerSupabase();

    const [yearsRes, gradesRes] = await Promise.all([
      supabase
        .from('student_profile')
        .select('school_year')
        .eq('school_id', schoolId)
        .not('school_year', 'is', null)
        .order('school_year', { ascending: false }),
      supabase
        .from('student_profile')
        .select('grade_level')
        .eq('school_id', schoolId)
        .not('grade_level', 'is', null)
        .order('grade_level', { ascending: true }),
    ]);

    if (yearsRes.error) {
      console.error('Students filters years error:', yearsRes.error);
      return NextResponse.json({ error: 'Failed to load school years' }, { status: 500 });
    }
    if (gradesRes.error) {
      console.error('Students filters grades error:', gradesRes.error);
      return NextResponse.json({ error: 'Failed to load grade levels' }, { status: 500 });
    }

    const yearsRows = (yearsRes.data ?? []) as { school_year?: string | null }[];
    const gradesRows = (gradesRes.data ?? []) as { grade_level?: string | null }[];

    const schoolYears = [...new Set(yearsRows.map((r) => r.school_year).filter(Boolean) as string[])];
    const gradeLevels = [...new Set(gradesRows.map((r) => r.grade_level).filter(Boolean) as string[])];

    return NextResponse.json({ schoolYears, gradeLevels });
  } catch (err) {
    console.error('Students filters GET internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

