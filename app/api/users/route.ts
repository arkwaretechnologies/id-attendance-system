import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { createServerSupabase } from '@/lib/supabase-server';

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
      username?: string;
      role?: string;
      school_id?: number | null;
    };
  } catch {
    return null;
  }
}

/** GET: list users from public.users (admin only; optionally scoped by school_id). */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user_id || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServerSupabase();
    let query = supabase
      .from('users')
      .select('user_id, username, fullname, role, school_id, email_address, contact_no, created_at, updated_at');

    if (session.school_id != null) {
      query = query.eq('school_id', session.school_id);
    }

    const { data: rows, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const users = (rows ?? []).map((r: Record<string, unknown>) => ({
      user_id: r.user_id,
      username: r.username,
      fullname: r.fullname,
      role: r.role,
      school_id: r.school_id,
      email_address: r.email_address ?? null,
      contact_no: r.contact_no ?? null,
      created_at: r.created_at ?? null,
      updated_at: r.updated_at ?? null,
    }));

    return NextResponse.json({ users });
  } catch (err) {
    console.error('Users GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST: create user in public.users (admin only). */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user_id || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = (await request.json()) as {
      username?: string;
      password?: string;
      fullname?: string;
      role?: string;
      school_id?: number | null;
      email_address?: string | null;
      contact_no?: string | null;
    };

    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const fullname = typeof body.fullname === 'string' ? body.fullname.trim() : '';
    const role = typeof body.role === 'string' && body.role.trim() ? body.role.trim() : 'reviewer';
    const school_id = session.school_id ?? body.school_id ?? null;
    const email_address = body.email_address ?? null;
    const contact_no = body.contact_no ?? null;

    if (!username || !password || !fullname) {
      return NextResponse.json(
        { error: 'Username, password, and full name are required.' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const password_hash = await bcrypt.hash(password, 10);
    const supabase = createServerSupabase();

    const { data: inserted, error } = await supabase
      .from('users')
      .insert({
        username,
        password_hash,
        fullname,
        role,
        school_id,
        email_address,
        contact_no,
      } as never)
      .select('user_id, username, fullname, role, school_id, email_address, contact_no, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Username already exists.' }, { status: 409 });
      }
      console.error('Create user error:', error);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        user_id: (inserted as Record<string, unknown>).user_id,
        username: (inserted as Record<string, unknown>).username,
        fullname: (inserted as Record<string, unknown>).fullname,
        role: (inserted as Record<string, unknown>).role,
        school_id: (inserted as Record<string, unknown>).school_id,
        email_address: (inserted as Record<string, unknown>).email_address ?? null,
        contact_no: (inserted as Record<string, unknown>).contact_no ?? null,
        created_at: (inserted as Record<string, unknown>).created_at ?? null,
      },
    });
  } catch (err) {
    console.error('Users POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
