import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerSupabase } from '@/lib/supabase-server';
import { PAGE_KEYS } from '@/types/database';

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
    return payload as { user_id?: number; role?: string };
  } catch {
    return null;
  }
}

/** GET: get one role with page_keys (admin only). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session?.user_id || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { roleId } = await params;
    const id = parseInt(roleId, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: role, error: roleError } = await supabase
      .from('role')
      .select('role_id, name, description, created_at, updated_at')
      .eq('role_id', id)
      .maybeSingle();

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const { data: rolePages } = await supabase
      .from('role_page')
      .select('page_key')
      .eq('role_id', id);

    const page_keys = (rolePages ?? []).map((r: { page_key: string }) => r.page_key);

    return NextResponse.json({
      role: {
        ...(role as object),
        page_keys,
      },
    });
  } catch (err) {
    console.error('Role GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PATCH: update role name, description, page_keys (admin only). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session?.user_id || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { roleId } = await params;
    const id = parseInt(roleId, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      page_keys?: string[];
    };

    const supabase = createServerSupabase();

    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) {
        return NextResponse.json({ error: 'Role name cannot be empty.' }, { status: 400 });
      }
      const { error: updateError } = await supabase
        .from('role')
        .update({
          name,
          description: body.description ?? null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('role_id', id);
      if (updateError) {
        if (updateError.code === '23505') {
          return NextResponse.json({ error: 'A role with this name already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
      }
    } else if (body.description !== undefined) {
      const { error: updateError } = await supabase
        .from('role')
        .update({ description: body.description, updated_at: new Date().toISOString() } as never)
        .eq('role_id', id);
      if (updateError) {
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
      }
    }

    if (body.page_keys !== undefined) {
      const validKeys = new Set(PAGE_KEYS);
      const page_keys = Array.isArray(body.page_keys)
        ? body.page_keys.filter((k) => validKeys.has(k as (typeof PAGE_KEYS)[number]))
        : [];

      await supabase.from('role_page').delete().eq('role_id', id);
      if (page_keys.length > 0) {
        const { error: insertError } = await supabase.from('role_page').insert(
          page_keys.map((page_key) => ({ role_id: id, page_key })) as never
        );
        if (insertError) {
          console.error('Update role_page error:', insertError);
        }
      }
    }

    const { data: role } = await supabase
      .from('role')
      .select('role_id, name, description, updated_at')
      .eq('role_id', id)
      .single();
    const { data: rolePages } = await supabase
      .from('role_page')
      .select('page_key')
      .eq('role_id', id);
    const page_keys = (rolePages ?? []).map((r: { page_key: string }) => r.page_key);

    return NextResponse.json({
      role: role ? { ...(role as object), page_keys } : { role_id: id, page_keys },
    });
  } catch (err) {
    console.error('Role PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE: delete role (admin only). Fails if users still have this role. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session?.user_id || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { roleId } = await params;
    const id = parseInt(roleId, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: role } = await supabase.from('role').select('name').eq('role_id', id).maybeSingle();
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', (role as { name: string }).name);
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role: one or more users still have this role. Reassign them first.' },
        { status: 400 }
      );
    }

    await supabase.from('role_page').delete().eq('role_id', id);
    const { error } = await supabase.from('role').delete().eq('role_id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Role DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
