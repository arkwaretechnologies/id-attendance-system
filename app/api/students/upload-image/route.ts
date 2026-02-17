import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'auth_session';
const BUCKET = 'student_image';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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

/** POST: upload student image to bucket student_image, return public URL. */
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

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Image must be 5MB or less' }, { status: 400 });
    }

    const type = file.type?.toLowerCase() ?? '';
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Allowed types: JPEG, PNG, GIF, WebP' }, { status: 400 });
    }

    const ext = type.split('/')[1] ?? 'jpg';
    const path = `${schoolId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const supabase = createServerSupabase();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: type, upsert: false });

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found')) {
        return NextResponse.json(
          { error: 'Storage bucket "student_image" not found. Create it in Supabase Dashboard > Storage.' },
          { status: 400 }
        );
      }
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('Upload image error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
