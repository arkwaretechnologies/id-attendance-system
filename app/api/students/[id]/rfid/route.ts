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

/** PATCH: set or remove RFID for a student. Student must belong to session school. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session?.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const schoolId = session.school_id ?? null;
    if (schoolId == null) {
      return NextResponse.json({ error: 'Missing school_id in session' }, { status: 400 });
    }

    const { id: studentId } = await params;
    if (!studentId) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    const body = (await request.json()) as { rfid_tag?: string | null };
    const rfidTag = body.rfid_tag === undefined ? undefined : (body.rfid_tag === null || body.rfid_tag === '' ? null : String(body.rfid_tag).trim());

    const supabase = createServerSupabase();

    const { data: student, error: fetchError } = await supabase
      .from('student_profile')
      .select('id, school_id')
      .eq('id', studentId)
      .single();

    if (fetchError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if ((student as { school_id?: number | null }).school_id !== schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('student_profile')
      .update({ rfid_tag: rfidTag ?? null } as never)
      .eq('id', studentId)
      .select('id, rfid_tag')
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'This RFID is already assigned to another student.' }, { status: 409 });
      }
      console.error('Update RFID error:', updateError);
      return NextResponse.json({ error: 'Failed to update RFID' }, { status: 500 });
    }

    return NextResponse.json({ student: updated });
  } catch (err) {
    console.error('RFID PATCH internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
