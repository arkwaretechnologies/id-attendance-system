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

/** GET: fetch one student by id. Must belong to session school. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(_request);
    if (!session?.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const schoolId = session.school_id ?? null;
    if (schoolId == null) {
      return NextResponse.json({ error: 'Missing school_id in session' }, { status: 400 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('student_profile')
      .select('*')
      .eq('id', id)
      .eq('school_id', schoolId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ student: data });
  } catch (err) {
    console.error('Students [id] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PATCH: update student. Must belong to session school. */
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createServerSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from('student_profile')
      .select('id, school_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if ((existing as { school_id?: number | null }).school_id !== schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedKeys = new Set([
      'learner_reference_number', 'last_name', 'first_name', 'middle_name', 'extension_name',
      'sex', 'birthdate', 'age', 'school_year', 'grade_level', 'email_address', 'phone_number',
      'rfid_tag', 'student_image_url', 'mother_tongue', 'current_house_number', 'current_sitio_street', 'current_barangay',
      'current_municipality_city', 'current_province', 'current_country', 'current_zip_code',
      'permanent_house_number', 'permanent_street', 'permanent_barangay', 'permanent_municipality_city',
      'permanent_province', 'permanent_country', 'permanent_zip_code', 'same_as_current_address',
      'place_of_birth_municipality_city', 'father_last_name', 'father_first_name', 'father_middle_name', 'father_contact_number',
      'mother_last_name', 'mother_first_name', 'mother_middle_name', 'mother_contact_number',
      'guardian_last_name', 'guardian_first_name', 'guardian_middle_name', 'guardian_contact_number',
    ]);
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.has(key)) {
        updates[key] = value;
      }
    }
    updates.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from('student_profile')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Student PATCH error:', updateError);
      return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
    }

    return NextResponse.json({ student: updated });
  } catch (err) {
    console.error('Students [id] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE: remove student. Must belong to session school. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(_request);
    if (!session?.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const schoolId = session.school_id ?? null;
    if (schoolId == null) {
      return NextResponse.json({ error: 'Missing school_id in session' }, { status: 400 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from('student_profile')
      .select('id, school_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if ((existing as { school_id?: number | null }).school_id !== schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('student_profile')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Student DELETE error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Students [id] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
