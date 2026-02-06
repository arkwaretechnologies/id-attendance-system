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
    return payload as { user_id?: number; school_id?: number | null };
  } catch {
    return null;
  }
}

/** GET: check if an RFID is already assigned to a student (for conflict check). */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const rfid = request.nextUrl.searchParams.get('rfid');
    if (!rfid || !rfid.trim()) {
      return NextResponse.json({ student: null });
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('student_profile')
      .select('id, first_name, last_name')
      .eq('rfid_tag', rfid.trim())
      .maybeSingle();

    if (error) {
      console.error('Check RFID error:', error);
      return NextResponse.json({ error: 'Failed to check RFID' }, { status: 500 });
    }

    return NextResponse.json({ student: data ?? null });
  } catch (err) {
    console.error('Check RFID internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
