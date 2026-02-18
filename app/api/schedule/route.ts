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
    return payload as { user_id?: number };
  } catch {
    return null;
  }
}

/** Normalize time to HH:mm for comparison and storage. */
function normalizeTime(t: string): string {
  const match = String(t).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return '';
  const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  const s = match[3] != null ? Math.min(59, Math.max(0, parseInt(match[3], 10))) : 0;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** GET: list all scan schedule sessions. */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('scan_schedule')
      .select('*')
      .order('time_in', { ascending: true });

    if (error) {
      console.error('Schedule GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
    return NextResponse.json({ schedule: data ?? [] });
  } catch (err) {
    console.error('Schedule GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST: create a new scan schedule session. Overlap is enforced by DB trigger. */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = (await request.json()) as { name?: string; time_in?: string; time_out?: string };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const timeIn = normalizeTime(body.time_in ?? '');
    const timeOut = normalizeTime(body.time_out ?? '');

    if (!name) {
      return NextResponse.json({ error: 'Session name is required.' }, { status: 400 });
    }
    if (!timeIn) {
      return NextResponse.json({ error: 'Time in is required (e.g. 08:00 or 08:30).' }, { status: 400 });
    }
    if (!timeOut) {
      return NextResponse.json({ error: 'Time out is required (e.g. 09:00 or 09:30).' }, { status: 400 });
    }
    if (timeOut <= timeIn) {
      return NextResponse.json({ error: 'Time out must be after time in.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('scan_schedule')
      .insert({ name, time_in: timeIn, time_out: timeOut } as never)
      .select()
      .single();

    if (error) {
      if (error.code === 'P0001' && error.message?.includes('overlap')) {
        return NextResponse.json(
          { error: 'This session overlaps with an existing session. Please choose different times.' },
          { status: 409 }
        );
      }
      console.error('Schedule POST error:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
    return NextResponse.json({ session: data });
  } catch (err) {
    console.error('Schedule POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
