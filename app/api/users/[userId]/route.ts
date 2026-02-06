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
      role?: string;
      school_id?: number | null;
    };
  } catch {
    return null;
  }
}

/** PATCH: update user in public.users (admin only). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session?.user_id || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = await params;
    const targetId = parseInt(userId, 10);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = (await request.json()) as {
      fullname?: string;
      role?: string;
      email_address?: string | null;
      contact_no?: string | null;
      password?: string;
    };

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof body.fullname === 'string' && body.fullname.trim()) {
      updates.fullname = body.fullname.trim();
    }
    if (typeof body.role === 'string' && body.role.trim()) {
      updates.role = body.role.trim();
    }
    if (body.email_address !== undefined) {
      updates.email_address = body.email_address;
    }
    if (body.contact_no !== undefined) {
      updates.contact_no = body.contact_no;
    }
    if (typeof body.password === 'string' && body.password.length >= 6) {
      updates.password_hash = await bcrypt.hash(body.password, 10);
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('users')
      .update(updates as never)
      .eq('user_id', targetId)
      .select('user_id, username, fullname, role, school_id, email_address, contact_no, updated_at')
      .maybeSingle();

    if (error) {
      console.error('Update user error:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        user_id: (data as Record<string, unknown>).user_id,
        username: (data as Record<string, unknown>).username,
        fullname: (data as Record<string, unknown>).fullname,
        role: (data as Record<string, unknown>).role,
        school_id: (data as Record<string, unknown>).school_id,
        email_address: (data as Record<string, unknown>).email_address ?? null,
        contact_no: (data as Record<string, unknown>).contact_no ?? null,
        updated_at: (data as Record<string, unknown>).updated_at ?? null,
      },
    });
  } catch (err) {
    console.error('Users PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE: remove user from public.users (admin only; cannot delete self). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session?.user_id || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = await params;
    const targetId = parseInt(userId, 10);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (targetId === session.user_id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account.' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();
    const { error } = await supabase.from('users').delete().eq('user_id', targetId);

    if (error) {
      console.error('Delete user error:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Users DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
